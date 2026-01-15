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

func TestReconstructListState_ItemAdded(t *testing.T) {
	eventTime := time.Date(2026, 1, 15, 10, 30, 0, 0, time.UTC)
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: ListCreatedPayload{
				Name:         "Shopping List",
				Participants: []string{"Alice"},
			},
			Timestamp: time.Now(),
		},
		{
			ID:   "evt-2",
			Type: EventTypeItemAdded,
			Payload: ItemAddedPayload{
				ItemID:    "item-1",
				Title:     "Buy milk",
				CreatedBy: "Alice",
			},
			Timestamp: eventTime,
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(state.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(state.Items))
	}

	item, exists := state.Items["item-1"]
	if !exists {
		t.Fatal("expected item 'item-1' to exist")
	}
	if item.Title != "Buy milk" {
		t.Errorf("expected title 'Buy milk', got '%s'", item.Title)
	}
	if item.CreatedBy != "Alice" {
		t.Errorf("expected CreatedBy 'Alice', got '%s'", item.CreatedBy)
	}
	if item.CreatedAt != "2026-01-15T10:30:00Z" {
		t.Errorf("expected CreatedAt '2026-01-15T10:30:00Z', got '%s'", item.CreatedAt)
	}
	if item.Completed {
		t.Error("expected item to not be completed")
	}
}

func TestReconstructListState_MultipleItems(t *testing.T) {
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: ListCreatedPayload{
				Name:         "Todo List",
				Participants: []string{"Bob"},
			},
			Timestamp: time.Now(),
		},
		{
			ID:   "evt-2",
			Type: EventTypeItemAdded,
			Payload: ItemAddedPayload{
				ItemID:    "item-1",
				Title:     "Task A",
				CreatedBy: "Bob",
			},
			Timestamp: time.Now(),
		},
		{
			ID:   "evt-3",
			Type: EventTypeItemAdded,
			Payload: ItemAddedPayload{
				ItemID:    "item-2",
				Title:     "Task B",
				CreatedBy: "Bob",
			},
			Timestamp: time.Now(),
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(state.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(state.Items))
	}

	if state.Items["item-1"].Title != "Task A" {
		t.Errorf("expected item-1 title 'Task A', got '%s'", state.Items["item-1"].Title)
	}
	if state.Items["item-2"].Title != "Task B" {
		t.Errorf("expected item-2 title 'Task B', got '%s'", state.Items["item-2"].Title)
	}
}

func TestReconstructListState_ItemAddedFromJSON(t *testing.T) {
	// Simulates reading from JSONL where payload is unmarshaled as map[string]any
	events := []Event{
		{
			ID:   "evt-1",
			Type: EventTypeListCreated,
			Payload: map[string]any{
				"name":         "Test List",
				"participants": []any{"User"},
			},
			Timestamp: time.Now(),
		},
		{
			ID:   "evt-2",
			Type: EventTypeItemAdded,
			Payload: map[string]any{
				"item_id":    "item-123",
				"title":      "Test item",
				"created_by": "User",
			},
			Timestamp: time.Now(),
		},
	}

	state, err := ReconstructListState(events)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(state.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(state.Items))
	}

	item, exists := state.Items["item-123"]
	if !exists {
		t.Fatal("expected item 'item-123' to exist")
	}
	if item.Title != "Test item" {
		t.Errorf("expected title 'Test item', got '%s'", item.Title)
	}
}
