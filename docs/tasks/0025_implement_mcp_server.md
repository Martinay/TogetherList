# 0025: Implement MCP Server as an HTTP Endpoint

## Goal
Implement a Model Context Protocol (MCP) server exposed as an HTTP endpoint on the Go backend server using `github.com/mark3labs/mcp-go`, supporting both Server-Sent Events (SSE) and message routing, with tools for all core list and item operations.

## Scope
- **Directory**: `backend/`
- **Files**:
  - `backend/internal/events/store.go`
  - `backend/internal/events/store_test.go`
  - `backend/internal/features/mcpserver/handler.go`
  - `backend/internal/features/mcpserver/tools.go`
  - `backend/internal/features/mcpserver/handler_test.go`
  - `backend/cmd/server/main.go`
  - `readme.md`

## Context
- `status.md`: Event sourcing architecture with file-based JSONL storage.
- `docs/adr/0025_mcp_server.md`: Decision to expose MCP via HTTP/SSE using `github.com/mark3labs/mcp-go`.
- `docs/requirements/0019_mcp_server.md`: REQ-0019 EARS requirement for MCP interface.

## Granular Instructions
- [x] Add `ListIDs()` method to `FileEventStore` in `backend/internal/events/store.go` with tests in `store_test.go`.
- [x] Implement `mcpserver` feature slice in `backend/internal/features/mcpserver/` using `github.com/mark3labs/mcp-go`.
- [x] Register tools: `create_list`, `get_list`, `list_lists`, `rename_list`, `add_item`, `complete_item`, `assign_item`, `update_item_title`, `update_item_description`.
- [x] Mount MCP HTTP handlers in `backend/cmd/server/main.go` on `/api/v1/mcp/sse` and `/api/v1/mcp/messages` (with `/mcp/sse` and `/mcp/messages` aliases).
- [x] Write comprehensive unit and integration tests in `backend/internal/features/mcpserver/server_test.go`.
- [x] Verify tests pass (`go test -race ./...`) and lint checks pass (`go vet ./...`).
- [x] Update documentation in `readme.md` detailing how AI clients connect to the MCP endpoint.

## Definition of Done
- [x] Code is implemented and verified.
- [x] Automated Tests are verified and passing with race detector enabled.
- [x] `status.md` updated after explicit user acceptance.
- [x] Next Task file created in `docs/tasks/`.

