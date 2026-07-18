package completeitem

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// CompleteItemRequest represents the incoming request body.
type CompleteItemRequest struct {
	IsCompleted bool   `json:"isCompleted"`
	CompletedBy string `json:"completedBy"`
}

// Handler handles PUT requests to toggle an item's completion status.
// Expected URL pattern: PUT /api/v1/list/{id}/items/{itemId}/completed
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract list ID and item ID from URL path
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

	var req CompleteItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	completedBy := strings.TrimSpace(req.CompletedBy)
	if completedBy == "" {
		http.Error(w, "CompletedBy is required", http.StatusBadRequest)
		return
	}

	// Create and persist ItemCompleted event
	store := events.NewFileEventStore()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemCompleted,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemCompletedPayload{
			ItemID:      itemID,
			IsCompleted: req.IsCompleted,
			CompletedBy: completedBy,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to update item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}
