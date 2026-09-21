---
status: Accepted
date: 2026-09-21
---

# AD: Model Context Protocol (MCP) Server as an HTTP Endpoint

## Context and Problem Statement

TogetherList is an event-sourced shared list management system. AI assistants and autonomous coding agents need programmatic, standardized access to manage lists, items, and participants.
The Model Context Protocol (MCP) has emerged as the open industry standard for connecting AI clients to external tool providers.
We need to decide how to implement and expose an MCP server within the TogetherList architecture so AI clients can access it over HTTP.

## Decision Drivers

* **Industry Compatibility**: Seamless integration with popular AI platforms (Cursor, Claude, Antigravity, custom agents).
* **Network Accessibility**: Ability to access the server remotely over HTTP without requiring local binary execution or access to the host filesystem.
* **Maintainability & Standard Compliance**: Conformance to the MCP specification without unnecessary maintenance overhead.
* **Architectural Consistency**: Adherence to Vertical Slice Architecture in Go and integration with the existing `FileEventStore`.

## Considered Options

1. **Option 1**: Use `github.com/mark3labs/mcp-go` to expose an HTTP/SSE MCP server within the backend web server.
2. **Option 2**: Implement a custom lightweight JSON-RPC 2.0 / MCP engine from scratch in Go.
3. **Option 3**: Provide a standalone stdio-only CLI executable.

### Cost Evaluation Per Option

#### Option 1: Use `github.com/mark3labs/mcp-go` (HTTP SSE + HTTP Handler)

**Building (Development)**:
- Authoring: Very low effort. The library provides high-level abstractions (`server.NewMCPServer`, `mcp.NewTool`, `server.NewSSEServer`), structured schema builders, and standard SSE session lifecycle management.
- Project Scale: Cleanly fits into a dedicated feature slice (`internal/features/mcpserver`) mounted on `cmd/server`.
- Onboarding: Standard Go library widely used across the Go MCP ecosystem; well-documented patterns.
- AI Assistance: LLMs understand `mark3labs/mcp-go` patterns well and generate accurate tool handlers.

**Running (Operations)**:
- Runtime: Negligible CPU and memory footprint. Runs inside the existing Go HTTP server process.
- Deployment: Zero additional deployment artifacts; deployed automatically as part of the existing Azure Container App.
- Maintenance & Debugging: Well-tested upstream library handles SSE connection edge cases, heartbeats, and protocol handshake variations.

**Externalities**:
- Interoperability: Fully compliant with the MCP specification, supporting both SSE transport and standard message routing.
- Security: Operates behind existing CORS and server middleware; inputs validated against defined JSON schemas.

#### Option 2: Custom JSON-RPC 2.0 / MCP Implementation from Scratch

**Building (Development)**:
- Authoring: Moderate-to-high effort. Requires manually writing JSON-RPC 2.0 message parsing, error codes, SSE connection management, session tracking, and schema validation.
- Project Scale: Increases internal codebase size by 500+ lines of custom protocol infrastructure.
- Onboarding: Requires team members to maintain custom protocol-level networking code.
- AI Assistance: Requires precise custom prompts to maintain and extend custom protocol handling.

**Running (Operations)**:
- Runtime: Highly efficient with zero third-party dependencies.
- Deployment: Part of backend binary.
- Maintenance & Debugging: Edge cases in SSE streaming, client reconnects, or protocol updates must be manually debugged and patched.

**Externalities**:
- Interoperability: Risk of subtle deviations from the official MCP specification across different AI client implementations.
- Security: Custom protocol parsers carry inherent risk of subtle parsing bugs.

#### Option 3: Standalone Stdio-only CLI Executable

**Building (Development)**:
- Authoring: Low effort for basic stdio, but does not meet the requirement for network/HTTP access.
- Project Scale: Requires separate build configuration, binary packaging, and distribution mechanism.
- Onboarding: Easy for local CLI developers, but not usable by remote web-based AI agents.
- AI Assistance: Good for local IDEs, unhelpful for cloud agents.

**Running (Operations)**:
- Runtime: Spawns a process per client connection on the local host.
- Deployment: Cannot be deployed to Container Apps as a service for remote users without an SSH/tunneling proxy.
- Maintenance & Debugging: Local OS-dependent path handling and file permission challenges.

**Externalities**:
- Interoperability: Inaccessible over HTTP; incompatible with web-based agents and remote services.
- Security: Requires direct local filesystem access to the event store files.

## Decision Outcome

Chosen option: **Option 1: Use `github.com/mark3labs/mcp-go` to expose an HTTP/SSE MCP server within the backend web server**.

### Rationale:
- It directly satisfies the user requirement to have the MCP server accessible as an HTTP endpoint.
- It leverages the proven, standard `github.com/mark3labs/mcp-go` library for robust protocol compliance and SSE session management.
- It integrates seamlessly into the existing Go `http.ServeMux` and shares the existing `FileEventStore` concurrent-safe architecture.

## Consequences

* Good, because AI assistants can connect to TogetherList over standard HTTP SSE (`/api/v1/mcp/sse`).
* Good, because development effort is minimized and standard schema validation is handled by the library.
* Good, because the MCP server deploys with the existing backend without separate infrastructure.
* Bad, because it introduces a third-party dependency (`github.com/mark3labs/mcp-go`) to `go.mod`.

## More Information

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [mark3labs/mcp-go GitHub Repository](https://github.com/mark3labs/mcp-go)
- Related Requirement: [REQ-0019](file:///Users/martin/repos/shared-list/docs/requirements/0019_mcp_server.md)
