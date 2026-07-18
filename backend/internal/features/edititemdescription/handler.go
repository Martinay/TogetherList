package edititemdescription

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// EditItemDescriptionRequest represents the incoming request body.
type EditItemDescriptionRequest struct {
	Description string `json:"description"`
}

// Handler handles PUT requests to edit an item's description.
// Expected URL pattern: PUT /api/v1/list/{id}/items/{itemId}/description
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

	var req EditItemDescriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create and persist ItemDescriptionEdited event
	store := events.NewFileEventStore()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemDescriptionEdited,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemDescriptionEditedPayload{
			ItemID:      itemID,
			Description: req.Description,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to update item description", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}
