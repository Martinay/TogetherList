package createlist

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// CreateListRequest represents the incoming request body.
type CreateListRequest struct {
	Creator      string   `json:"creator"`
	Participants []string `json:"participants"`
}

// CreateListResponse represents the response body.
type CreateListResponse struct {
	ListID string `json:"listId"`
}

// Handler handles POST requests to create a new list.
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Creator == "" {
		http.Error(w, "Creator name is required", http.StatusBadRequest)
		return
	}

	// Ensure creator is in participant list
	participants := req.Participants
	creatorFound := false
	for _, p := range participants {
		if p == req.Creator {
			creatorFound = true
			break
		}
	}
	if !creatorFound {
		participants = append([]string{req.Creator}, participants...)
	}

	// Validate no duplicate participants
	seen := make(map[string]bool)
	for _, p := range participants {
		if seen[p] {
			http.Error(w, "Duplicate participant names are not allowed", http.StatusBadRequest)
			return
		}
		seen[p] = true
	}

	// Generate new list ID
	listID := uuid.New().String()

	// Create and persist ListCreated event
	store := events.NewFileEventStore()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeListCreated,
		Timestamp: time.Now().UTC(),
		Payload: events.ListCreatedPayload{
			Name:         "",
			Participants: participants,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to create list", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateListResponse{ListID: listID})
}
