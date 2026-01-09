// Package events provides event sourcing types and storage.
package events

import "time"

// Event represents a single event in the event store.
// Events are immutable and append-only.
type Event struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Payload   any       `json:"payload"`
	Timestamp time.Time `json:"timestamp"`
}

// Store defines the interface for event storage operations.
// Implementations will handle JSONL file persistence.
type Store interface {
	// Append adds a new event to the store.
	Append(event Event) error

	// ReadAll returns all events from the store.
	ReadAll() ([]Event, error)

	// ReadSince returns events after the given timestamp.
	ReadSince(since time.Time) ([]Event, error)
}
