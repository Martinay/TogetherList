package viewlist

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/events"
)

// Handler handles GET requests to view a list's current state.
// Expected URL pattern: /api/v1/list/{id}
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract list ID from URL path: /api/v1/list/{id}
	path := r.URL.Path
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid URL path", http.StatusBadRequest)
		return
	}
	listID := parts[3] // api/v1/list/{id} -> parts[3] is the ID

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
	json.NewEncoder(w).Encode(state)
}
