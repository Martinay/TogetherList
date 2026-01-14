// Package events provides event sourcing types and storage.
package events

import (
	"encoding/json"
	"fmt"
)

// ItemState represents the current state of a list item.
type ItemState struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	AssignedTo string `json:"assigned_to,omitempty"`
	Completed  bool   `json:"completed"`
}

// ListState represents the current state of a list, reconstructed from events.
type ListState struct {
	Name         string                `json:"name"`
	Participants []string              `json:"participants"`
	Items        map[string]*ItemState `json:"items"`
	Users        []string              `json:"users"` // Users who have joined
}

// NewListState creates an empty ListState.
func NewListState() *ListState {
	return &ListState{
		Items: make(map[string]*ItemState),
		Users: []string{},
	}
}

// ReconstructListState builds the current list state from a sequence of events.
func ReconstructListState(events []Event) (*ListState, error) {
	state := NewListState()

	for _, event := range events {
		if err := applyEvent(state, event); err != nil {
			return nil, fmt.Errorf("failed to apply event %s: %w", event.ID, err)
		}
	}

	return state, nil
}

// applyEvent applies a single event to the state.
func applyEvent(state *ListState, event Event) error {
	switch event.Type {
	case EventTypeListCreated:
		payload, err := parsePayload[ListCreatedPayload](event.Payload)
		if err != nil {
			return err
		}
		state.Name = payload.Name
		state.Participants = payload.Participants
	case EventTypeItemAdded:
		payload, err := parsePayload[ItemAddedPayload](event.Payload)
		if err != nil {
			return err
		}
		state.Items[payload.ItemID] = &ItemState{
			ID:        payload.ItemID,
			Title:     payload.Title,
			Completed: false,
		}
	default:
		// Unknown event types are ignored for forward compatibility
		// This allows new event types to be added without breaking old code
	}

	return nil
}

// parsePayload converts the generic payload to a specific type.
func parsePayload[T any](payload any) (T, error) {
	var result T

	// If payload is already the correct type, return it
	if typed, ok := payload.(T); ok {
		return typed, nil
	}

	// Otherwise, marshal and unmarshal to convert (handles map[string]any from JSON)
	bytes, err := json.Marshal(payload)
	if err != nil {
		return result, fmt.Errorf("failed to marshal payload: %w", err)
	}

	if err := json.Unmarshal(bytes, &result); err != nil {
		return result, fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	return result, nil
}
