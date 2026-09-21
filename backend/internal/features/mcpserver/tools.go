package mcpserver

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/internal/events"

	"github.com/google/uuid"
	"github.com/mark3labs/mcp-go/mcp"
)

// ListSummary represents high-level metadata about an existing list.
type ListSummary struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	ParticipantCount int    `json:"participantCount"`
	ItemCount        int    `json:"itemCount"`
	CompletedCount   int    `json:"completedCount"`
}

func (s *Server) registerTools() {
	// 1. list_lists
	s.mcpServer.AddTool(
		mcp.NewTool(
			"list_lists",
			mcp.WithDescription("List all existing shared lists with summary metadata (IDs, names, participant counts, item counts)"),
		),
		s.handleListLists,
	)

	// 2. get_list
	s.mcpServer.AddTool(
		mcp.NewTool(
			"get_list",
			mcp.WithDescription("Get the full current state of a shared list including items, completion status, and participants"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
		),
		s.handleGetList,
	)

	// 3. create_list
	s.mcpServer.AddTool(
		mcp.NewTool(
			"create_list",
			mcp.WithDescription("Create a new shared list with a name and participants"),
			mcp.WithString("name", mcp.Required(), mcp.Description("Name of the list")),
			mcp.WithString("creator", mcp.Required(), mcp.Description("Name of the person creating the list")),
			mcp.WithArray(
				"participants",
				mcp.Description("Optional list of participant names (creator is automatically included)"),
				mcp.Items(map[string]any{"type": "string"}),
			),
		),
		s.handleCreateList,
	)

	// 4. rename_list
	s.mcpServer.AddTool(
		mcp.NewTool(
			"rename_list",
			mcp.WithDescription("Rename a shared list"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("name", mcp.Required(), mcp.Description("New name of the list")),
			mcp.WithString("renamed_by", mcp.Required(), mcp.Description("Name of the participant renaming the list")),
		),
		s.handleRenameList,
	)

	// 5. add_item
	s.mcpServer.AddTool(
		mcp.NewTool(
			"add_item",
			mcp.WithDescription("Add a new item to a shared list"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("title", mcp.Required(), mcp.Description("Title of the item")),
			mcp.WithString("created_by", mcp.Required(), mcp.Description("Name of the participant creating the item")),
		),
		s.handleAddItem,
	)

	// 6. complete_item
	s.mcpServer.AddTool(
		mcp.NewTool(
			"complete_item",
			mcp.WithDescription("Mark an item in a list as completed or uncompleted"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("item_id", mcp.Required(), mcp.Description("The UUID of the item")),
			mcp.WithBoolean("completed", mcp.Required(), mcp.Description("True to mark completed, false to mark uncompleted")),
			mcp.WithString("completed_by", mcp.Required(), mcp.Description("Name of the participant completing/uncompleting")),
		),
		s.handleCompleteItem,
	)

	// 7. assign_item
	s.mcpServer.AddTool(
		mcp.NewTool(
			"assign_item",
			mcp.WithDescription("Assign an item to one or more participants"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("item_id", mcp.Required(), mcp.Description("The UUID of the item")),
			mcp.WithArray(
				"assigned_to",
				mcp.Required(),
				mcp.Description("List of participant names to assign the item to"),
				mcp.Items(map[string]any{"type": "string"}),
			),
		),
		s.handleAssignItem,
	)

	// 8. update_item_title
	s.mcpServer.AddTool(
		mcp.NewTool(
			"update_item_title",
			mcp.WithDescription("Rename or update the title of an item in a list"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("item_id", mcp.Required(), mcp.Description("The UUID of the item")),
			mcp.WithString("title", mcp.Required(), mcp.Description("New title of the item")),
		),
		s.handleUpdateItemTitle,
	)

	// 9. update_item_description
	s.mcpServer.AddTool(
		mcp.NewTool(
			"update_item_description",
			mcp.WithDescription("Update the detailed description of an item in a list"),
			mcp.WithString("list_id", mcp.Required(), mcp.Description("The UUID of the list")),
			mcp.WithString("item_id", mcp.Required(), mcp.Description("The UUID of the item")),
			mcp.WithString("description", mcp.Required(), mcp.Description("New description of the item")),
		),
		s.handleUpdateItemDescription,
	)
}

func (s *Server) handleListLists(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	ids, err := s.store.ListIDs()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to list lists: %v", err)), nil
	}

	summaries := make([]ListSummary, 0, len(ids))
	for _, id := range ids {
		allEvents, err := s.store.ReadAll(id)
		if err != nil || len(allEvents) == 0 {
			continue
		}
		state, err := events.ReconstructListState(allEvents)
		if err != nil {
			continue
		}

		completed := 0
		for _, item := range state.Items {
			if item.Completed {
				completed++
			}
		}

		summaries = append(summaries, ListSummary{
			ID:               id,
			Name:             state.Name,
			ParticipantCount: len(state.Participants),
			ItemCount:        len(state.Items),
			CompletedCount:   completed,
		})
	}

	bytes, err := json.Marshal(summaries)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to marshal list summaries: %v", err)), nil
	}
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleGetList(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	allEvents, err := s.store.ReadAll(listID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to read list events: %v", err)), nil
	}
	if len(allEvents) == 0 {
		return mcp.NewToolResultError(fmt.Sprintf("List not found: %s", listID)), nil
	}

	state, err := events.ReconstructListState(allEvents)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to reconstruct list state: %v", err)), nil
	}

	resultMap := map[string]any{
		"id":           listID,
		"name":         state.Name,
		"participants": state.Participants,
		"items":        state.Items,
		"users":        state.Users,
	}

	bytes, err := json.Marshal(resultMap)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to marshal list state: %v", err)), nil
	}
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleCreateList(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	name := strings.TrimSpace(req.GetString("name", ""))
	if name == "" {
		return mcp.NewToolResultError("name is required"), nil
	}

	creator := strings.TrimSpace(req.GetString("creator", ""))
	if creator == "" {
		return mcp.NewToolResultError("creator is required"), nil
	}

	participants := req.GetStringSlice("participants", nil)

	creatorFound := false
	for _, p := range participants {
		if p == creator {
			creatorFound = true
			break
		}
	}
	if !creatorFound {
		participants = append([]string{creator}, participants...)
	}

	seen := make(map[string]bool)
	for _, p := range participants {
		if seen[p] {
			return mcp.NewToolResultError(fmt.Sprintf("Duplicate participant name: %s", p)), nil
		}
		seen[p] = true
	}

	listID := uuid.New().String()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeListCreated,
		Timestamp: time.Now().UTC(),
		Payload: events.ListCreatedPayload{
			Name:         name,
			Participants: participants,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to persist list: %v", err)), nil
	}

	resp := map[string]any{
		"listId":       listID,
		"name":         name,
		"participants": participants,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleRenameList(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	name := strings.TrimSpace(req.GetString("name", ""))
	if name == "" {
		return mcp.NewToolResultError("name is required"), nil
	}

	renamedBy := strings.TrimSpace(req.GetString("renamed_by", ""))
	if renamedBy == "" {
		return mcp.NewToolResultError("renamed_by is required"), nil
	}

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeListRenamed,
		Timestamp: time.Now().UTC(),
		Payload: events.ListRenamedPayload{
			Name:      name,
			RenamedBy: renamedBy,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to persist rename event: %v", err)), nil
	}

	resp := map[string]any{
		"listId":    listID,
		"name":      name,
		"renamedBy": renamedBy,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleAddItem(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	title := strings.TrimSpace(req.GetString("title", ""))
	if title == "" {
		return mcp.NewToolResultError("title is required"), nil
	}

	createdBy := strings.TrimSpace(req.GetString("created_by", ""))
	if createdBy == "" {
		return mcp.NewToolResultError("created_by is required"), nil
	}

	itemID := uuid.New().String()
	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemAdded,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemAddedPayload{
			ItemID:    itemID,
			Title:     title,
			CreatedBy: createdBy,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to persist item: %v", err)), nil
	}

	resp := map[string]any{
		"listId":    listID,
		"itemId":    itemID,
		"title":     title,
		"createdBy": createdBy,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleCompleteItem(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	itemID := strings.TrimSpace(req.GetString("item_id", ""))
	if itemID == "" {
		return mcp.NewToolResultError("item_id is required"), nil
	}
	if parsed, err := uuid.Parse(itemID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid item_id format, expected UUIDv4"), nil
	}

	completed := req.GetBool("completed", false)
	completedBy := strings.TrimSpace(req.GetString("completed_by", ""))
	if completedBy == "" {
		return mcp.NewToolResultError("completed_by is required"), nil
	}

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemCompleted,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemCompletedPayload{
			ItemID:      itemID,
			IsCompleted: completed,
			CompletedBy: completedBy,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to update item completion: %v", err)), nil
	}

	resp := map[string]any{
		"listId":      listID,
		"itemId":      itemID,
		"completed":   completed,
		"completedBy": completedBy,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleAssignItem(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	itemID := strings.TrimSpace(req.GetString("item_id", ""))
	if itemID == "" {
		return mcp.NewToolResultError("item_id is required"), nil
	}
	if parsed, err := uuid.Parse(itemID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid item_id format, expected UUIDv4"), nil
	}

	assignedTo, err := req.RequireStringSlice("assigned_to")
	if err != nil {
		return mcp.NewToolResultError("assigned_to must be a string array"), nil
	}

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemAssigned,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemAssignedPayload{
			ItemID:     itemID,
			AssignedTo: assignedTo,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to assign item: %v", err)), nil
	}

	resp := map[string]any{
		"listId":     listID,
		"itemId":     itemID,
		"assignedTo": assignedTo,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleUpdateItemTitle(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	itemID := strings.TrimSpace(req.GetString("item_id", ""))
	if itemID == "" {
		return mcp.NewToolResultError("item_id is required"), nil
	}
	if parsed, err := uuid.Parse(itemID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid item_id format, expected UUIDv4"), nil
	}

	title := strings.TrimSpace(req.GetString("title", ""))
	if title == "" {
		return mcp.NewToolResultError("title is required"), nil
	}

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemTitleEdited,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemTitleEditedPayload{
			ItemID:   itemID,
			NewTitle: title,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to update item title: %v", err)), nil
	}

	resp := map[string]any{
		"listId": listID,
		"itemId": itemID,
		"title":  title,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}

func (s *Server) handleUpdateItemDescription(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	listID := strings.TrimSpace(req.GetString("list_id", ""))
	if listID == "" {
		return mcp.NewToolResultError("list_id is required"), nil
	}
	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid list_id format, expected UUIDv4"), nil
	}

	itemID := strings.TrimSpace(req.GetString("item_id", ""))
	if itemID == "" {
		return mcp.NewToolResultError("item_id is required"), nil
	}
	if parsed, err := uuid.Parse(itemID); err != nil || parsed.Version() != 4 {
		return mcp.NewToolResultError("invalid item_id format, expected UUIDv4"), nil
	}

	description := req.GetString("description", "")

	event := events.Event{
		ID:        uuid.New().String(),
		Type:      events.EventTypeItemDescriptionEdited,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemDescriptionEditedPayload{
			ItemID:      itemID,
			Description: description,
		},
	}

	if err := s.store.Append(listID, event); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to update item description: %v", err)), nil
	}

	resp := map[string]any{
		"listId":      listID,
		"itemId":      itemID,
		"description": description,
	}
	bytes, _ := json.Marshal(resp)
	return mcp.NewToolResultText(string(bytes)), nil
}
