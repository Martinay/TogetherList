---
id: REQ-0019
status: Implemented
type: Functional
priority: P1
source: user request
created: 2026-09-21
updated: 2026-09-21
links:
  adr: [AD-0025]
  requirements: [REQ-0002, REQ-0006, REQ-0007, REQ-0008, REQ-0009]
tags: [mcp, llm, ai, sse, http, tools]
---

# REQ-0019: Model Context Protocol (MCP) HTTP Endpoint

## Context

AI assistants and autonomous agents (such as Claude, Cursor, Antigravity, and other LLM-based clients) increasingly integrate with external systems via the open Model Context Protocol (MCP).
TogetherList needs to expose its core list and item management capabilities directly over HTTP so AI clients can discover and execute operations against shared lists without manual UI interaction.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When an MCP client initiates a connection to the application's HTTP MCP endpoint, the system shall provide Model Context Protocol services allowing the client to initialize a session, discover available tools, and execute operations to create lists, retrieve lists, list existing lists, rename lists, add items, complete items, assign items, update item titles, and edit item descriptions.

## Rationale

- Enables seamless AI integration for task management, automation, and list synchronization.
- Exposing the interface via an HTTP endpoint allows remote AI agents and developer tools to connect over the network.
- Standardizing on MCP ensures compatibility with existing and future AI toolchains without custom client-side integration code.

## Acceptance Criteria

- Given the backend HTTP server is running
- When an MCP client initiates an SSE connection to `/api/v1/mcp/sse` (or `/mcp/sse`)
- Then the system shall respond with `text/event-stream` and emit an `endpoint` event containing the message POST URI with a valid session identifier

- Given an active MCP session
- When an MCP client requests the list of tools (`tools/list`)
- Then the system shall return tool definitions with JSON schemas for: `create_list`, `get_list`, `list_lists`, `rename_list`, `add_item`, `complete_item`, `assign_item`, `update_item_title`, and `update_item_description`

- Given an active MCP session
- When an MCP client invokes a tool via `tools/call` with valid parameters
- Then the system shall execute the requested operation against the event store, persist the resulting domain event, and return the result formatted per MCP specification

- Given an active MCP session
- When an MCP client invokes a tool with missing or invalid parameters
- Then the system shall return a descriptive error response indicating the validation failure

- Given an MCP client sends a direct JSON-RPC POST request to `/api/v1/mcp`
- When the request body contains a valid JSON-RPC 2.0 message
- Then the system shall process the request and return the JSON-RPC response with `Content-Type: application/json`

## Verification

- Method: Test
- Evidence: Automated Go unit and integration tests verifying HTTP SSE streaming, message dispatch, tool schema definitions, tool execution persistence, and error handling.

## Dependencies and Relationships

- Related requirements: REQ-0002 (List Creation), REQ-0006 (Item Creation), REQ-0007 (Item Editing), REQ-0008 (Item Assignment), REQ-0009 (Item Completion)
- Constraining ADRs: AD-0025 (MCP Server Implementation)
- Impacted components: `backend/cmd/server/main.go`, `backend/internal/features/mcpserver/`

## Notes

The MCP server implementation uses `github.com/mark3labs/mcp-go`.
