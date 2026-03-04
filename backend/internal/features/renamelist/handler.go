package renamelist

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
)

// RenameListRequest represents the incoming request body.
type RenameListRequest struct {
	Name      string `json:"name"`
	RenamedBy string `json:"renamedBy"`
}

// Handler handles PUT requests to rename a list.
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	listID := r.PathValue("id")
	if listID == "" {
		http.Error(w, "List ID is required", http.StatusBadRequest)
		return
	}

	var req RenameListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "List name is required", http.StatusBadRequest)
		return
	}
	if req.RenamedBy == "" {
		http.Error(w, "RenamedBy is required", http.StatusBadRequest)
		return
	}

	store := events.NewFileEventStore()

	// Verify the list exists and the user is a participant
	historicEvents, err := store.ReadAll(listID)
	if err != nil {
		http.Error(w, "Failed to load list events: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(historicEvents) == 0 {
		http.Error(w, "List not found", http.StatusNotFound)
		return
	}

	state, err := events.ReconstructListState(historicEvents)
	if err != nil {
		http.Error(w, "Failed to reconstruct list state: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Verify participant
	isParticipant := false
	for _, p := range state.Participants {
		if p == req.RenamedBy {
			isParticipant = true
			break
		}
	}

	if !isParticipant {
		http.Error(w, "User is not a participant of this list", http.StatusForbidden)
		return
	}

	// Create and persist ListRenamed event
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeListRenamed,
		Timestamp: time.Now().UTC(),
		Payload: events.ListRenamedPayload{
			Name:      req.Name,
			RenamedBy: req.RenamedBy,
		},
	}

	if err := store.Append(listID, event); err != nil {
		http.Error(w, "Failed to append event: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
