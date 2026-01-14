package additem

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// AddItemRequest represents the incoming request body.
type AddItemRequest struct {
	Title string `json:"title"`
}

// AddItemResponse represents the response body.
type AddItemResponse struct {
	ItemID string `json:"itemId"`
}

// Handler handles POST requests to add a new item to a list.
// Expected URL pattern: /api/v1/list/{id}/items
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract list ID from URL path: /api/v1/list/{id}/items
	path := r.URL.Path
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid URL path", http.StatusBadRequest)
		return
	}
	listID := parts[3] // api/v1/list/{id}/items -> parts[3] is the ID

	var req AddItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Generate new item ID
	itemID := uuid.New().String()

	// Create and persist ItemAdded event
	store := events.NewFileEventStore()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemAdded,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemAddedPayload{
			ItemID: itemID,
			Title:  title,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to add item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AddItemResponse{ItemID: itemID})
}
