package assignitem

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// AssignItemRequest represents the incoming request body.
type AssignItemRequest struct {
	AssignedTo []string `json:"assignedTo"`
}

// Handler handles PUT requests to assign participants to an item.
// Expected URL pattern: PUT /api/v1/list/{id}/items/{itemId}/assigned-to
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	listID := r.PathValue("id")
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		http.Error(w, "Invalid list ID", http.StatusBadRequest)
		return
	}
	itemID := r.PathValue("itemId")
	if parsed, err := uuid.Parse(itemID); err != nil || parsed.Version() != 4 {
		http.Error(w, "Invalid item ID", http.StatusBadRequest)
		return
	}

	var req AssignItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	store := events.NewFileEventStore()
	allEvents, err := store.ReadAll(listID)
	if err != nil {
		http.Error(w, "Failed to read list", http.StatusInternalServerError)
		return
	}

	state, err := events.ReconstructListState(allEvents)
	if err != nil {
		http.Error(w, "Failed to reconstruct list state", http.StatusInternalServerError)
		return
	}

	if _, exists := state.Items[itemID]; !exists {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	participantSet := map[string]bool{}
	for _, participant := range state.Participants {
		participantSet[participant] = true
	}

	normalized := make([]string, 0, len(req.AssignedTo))
	seen := map[string]bool{}
	for _, assignee := range req.AssignedTo {
		trimmed := strings.TrimSpace(assignee)
		if trimmed == "" {
			continue
		}
		if !participantSet[trimmed] {
			http.Error(w, "Unknown participant in assignment", http.StatusBadRequest)
			return
		}
		if seen[trimmed] {
			continue
		}
		seen[trimmed] = true
		normalized = append(normalized, trimmed)
	}

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemAssigned,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemAssignedPayload{
			ItemID:     itemID,
			AssignedTo: normalized,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to update item assignment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}
