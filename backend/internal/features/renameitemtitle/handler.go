package renameitemtitle

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// RenameItemTitleRequest represents the incoming request body.
type RenameItemTitleRequest struct {
	NewTitle string `json:"newTitle"`
}

// Handler handles PUT requests to rename an item's title.
// Expected URL pattern: PUT /api/v1/list/{id}/items/{itemId}/title
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

	var req RenameItemTitleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	newTitle := strings.TrimSpace(req.NewTitle)
	if newTitle == "" {
		http.Error(w, "NewTitle is required", http.StatusBadRequest)
		return
	}

	// Create and persist ItemTitleEdited event
	store := events.NewFileEventStore()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemTitleEdited,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemTitleEditedPayload{
			ItemID:   itemID,
			NewTitle: newTitle,
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
