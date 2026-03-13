// Package events provides event sourcing types and storage.
package events

// Event type constants.
const (
	EventTypeListCreated           = "ListCreated"
	EventTypeItemAdded             = "ItemAdded"
	EventTypeItemTitleEdited       = "ItemTitleEdited"
	EventTypeItemDescriptionEdited = "ItemDescriptionEdited"
	EventTypeItemCompleted         = "ItemCompleted"
	EventTypeItemAssigned          = "ItemAssigned"
	EventTypeListRenamed           = "ListRenamed"
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

// ItemCompletedPayload represents the data for an item completion toggle event.
type ItemCompletedPayload struct {
	ItemID      string `json:"item_id"`
	IsCompleted bool   `json:"is_completed"`
	CompletedBy string `json:"completed_by"`
}

// ItemDescriptionEditedPayload represents the data for an item description edit event.
type ItemDescriptionEditedPayload struct {
	ItemID      string `json:"item_id"`
	Description string `json:"description"`
}

// ItemAssignedPayload represents the data for an item assignment event.
type ItemAssignedPayload struct {
	ItemID     string   `json:"item_id"`
	AssignedTo []string `json:"assigned_to"`
}

// ListRenamedPayload represents the data for a list rename event.
type ListRenamedPayload struct {
	Name      string `json:"name"`
	RenamedBy string `json:"renamed_by"`
}
