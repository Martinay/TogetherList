package viewlist

import (
	"encoding/json"
	"net/http"

	"backend/internal/events"

	"github.com/google/uuid"
)

// Handler handles GET requests to view a list's current state.
// Expected URL pattern: /api/v1/list/{id}
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract list ID from URL path
	listID := r.PathValue("id")
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		http.Error(w, "Invalid list ID", http.StatusBadRequest)
		return
	}

	// Read all events for this list
	store := events.NewFileEventStore()
	allEvents, err := store.ReadAll(listID)
	if err != nil {
		http.Error(w, "Failed to read list", http.StatusInternalServerError)
		return
	}

	// Reconstruct state from events
	state, err := events.ReconstructListState(allEvents)
	if err != nil {
		http.Error(w, "Failed to reconstruct list state", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(state)
}
