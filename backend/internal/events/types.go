// Package events provides event sourcing types and storage.
package events

// Event type constants.
const (
	EventTypeListCreated = "ListCreated"
)

// ListCreatedPayload represents the data for a list creation event.
type ListCreatedPayload struct {
	Name         string   `json:"name"`
	Participants []string `json:"participants"`
}
