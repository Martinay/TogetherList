package events

import (
	"testing"
	"time"
)

func TestReconstructListState_Empty(t *testing.T) {
	state, err := ReconstructListState([]Event{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if state.Name != "" {
		t.Errorf("expected empty name, got %s", state.Name)
	}
	if len(state.Participants) != 0 {
		t.Errorf("expected no participants, got %d", len(state.Participants))
	}
	if len(state.Items) != 0 {
		t.Errorf("expected no items, got %d", len(state.Items))
	}
}

func TestReconstructListState_ListCreated(t *testing.T) {
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: ListCreatedPayload{
				Name:         "Shopping List",
				Participants: []string{"Alice", "Bob", "Charlie"},
			},
			Timestamp: time.Now(),
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if state.Name != "Shopping List" {
		t.Errorf("expected name 'Shopping List', got '%s'", state.Name)
	}
	if len(state.Participants) != 3 {
		t.Errorf("expected 3 participants, got %d", len(state.Participants))
	}
	if state.Participants[0] != "Alice" {
		t.Errorf("expected first participant 'Alice', got '%s'", state.Participants[0])
	}
}

func TestReconstructListState_ListCreatedFromJSON(t *testing.T) {
	// This test simulates what happens when reading from JSONL
	// where payload is unmarshaled as map[string]any
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: map[string]any{
				"name":         "Party List",
				"participants": []any{"Dave", "Eve"},
			},
			Timestamp: time.Now(),
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if state.Name != "Party List" {
		t.Errorf("expected name 'Party List', got '%s'", state.Name)
	}
	if len(state.Participants) != 2 {
		t.Errorf("expected 2 participants, got %d", len(state.Participants))
	}
}

func TestReconstructListState_UnknownEventType(t *testing.T) {
	// Unknown event types should be ignored for forward compatibility
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: ListCreatedPayload{
				Name:         "Test List",
				Participants: []string{"User1"},
			},
			Timestamp: time.Now(),
		},
		{
			ID:        "evt-2",
			Type:      "FutureEventType",
			Payload:   map[string]any{"some": "data"},
			Timestamp: time.Now(),
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// State should still be valid from the ListCreated event
	if state.Name != "Test List" {
		t.Errorf("expected name 'Test List', got '%s'", state.Name)
	}
}
