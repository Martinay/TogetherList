// Package events provides event sourcing types and storage.
package events

// Event type constants.
const (
	EventTypeListCreated     = "ListCreated"
	EventTypeItemAdded       = "ItemAdded"
	EventTypeItemTitleEdited = "ItemTitleEdited"
)

// ListCreatedPayload represents the data for a list creation event.
type ListCreatedPayload struct {
	Name         string   `json:"name"`
	Participants []string `json:"participants"`
}

// ItemAddedPayload represents the data for an item addition event.
type ItemAddedPayload struct {
	ItemID    string `json:"item_id"`
	Title     string `json:"title"`
	CreatedBy string `json:"created_by"`
}

// ItemTitleEditedPayload represents the data for an item title edit event.
type ItemTitleEditedPayload struct {
	ItemID   string `json:"item_id"`
	NewTitle string `json:"new_title"`
}
