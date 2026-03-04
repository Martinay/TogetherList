package edititemdescription

import (
	"encoding/json"
	"net/http"
	"strings"
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

	// Extract list ID and item ID from URL path: /api/v1/list/{id}/items/{itemId}/description
	path := r.URL.Path
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 7 {
		http.Error(w, "Invalid URL path", http.StatusBadRequest)
		return
	}
	listID := parts[3] // api/v1/list/{id}/items/{itemId}/description -> parts[3] is the list ID
	itemID := parts[5] // parts[5] is the item ID

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
