package mcpserver

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"backend/internal/events"

	"github.com/google/uuid"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// Server wraps the MCP server and its HTTP SSE server.
type Server struct {
	mcpServer *server.MCPServer
	sseServer *server.SSEServer
	store     *events.FileEventStore
}

// NewServer creates and configures a new MCP server with all tools and SSE support.
func NewServer(store *events.FileEventStore) *Server {
	if store == nil {
		store = events.NewFileEventStore()
	}

	mcpServer := server.NewMCPServer(
		"TogetherList",
		"1.0.0",
		server.WithToolCapabilities(true),
		server.WithResourceCapabilities(true, true),
	)

	s := &Server{
		mcpServer: mcpServer,
		store:     store,
	}

	s.registerTools()
	s.registerResources()

	// Initialize SSE server wrapping MCPServer
	s.sseServer = server.NewSSEServer(
		mcpServer,
		server.WithStaticBasePath("/api/v1/mcp"),
		server.WithSSEEndpoint("/sse"),
		server.WithMessageEndpoint("/messages"),
		server.WithUseFullURLForMessageEndpoint(false),
		server.WithSSEDisableLocalhostProtection(true),
	)

	return s
}

// SSEServer returns the underlying SSEServer.
func (s *Server) SSEServer() *server.SSEServer {
	return s.sseServer
}

// MCPServer returns the underlying MCPServer.
func (s *Server) MCPServer() *server.MCPServer {
	return s.mcpServer
}

// ServeHTTP implements http.Handler for direct JSON-RPC POST requests.
// This allows clients to send standard JSON-RPC 2.0 requests directly over HTTP POST
// (e.g. POST /api/v1/mcp).
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var raw json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		http.Error(w, "Invalid JSON-RPC request", http.StatusBadRequest)
		return
	}

	resp := s.mcpServer.HandleMessage(r.Context(), raw)
	if resp != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
		return
	}

	// Notifications return 204 No Content
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) registerResources() {
	s.mcpServer.AddResourceTemplate(
		mcp.NewResourceTemplate(
			"list://{listId}",
			"List State",
			mcp.WithTemplateDescription("Current state of a shared list including items and participants"),
			mcp.WithTemplateMIMEType("application/json"),
		),
		s.handleReadListResource,
	)
}

func (s *Server) handleReadListResource(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
	uri := req.Params.URI
	listID := strings.TrimPrefix(uri, "list://")
	listID = strings.TrimSpace(listID)

	if parsed, err := uuid.Parse(listID); err != nil || parsed.Version() != 4 {
		return nil, fmt.Errorf("invalid list ID in URI %q", uri)
	}

	allEvents, err := s.store.ReadAll(listID)
	if err != nil {
		return nil, fmt.Errorf("failed to read events: %w", err)
	}
	if len(allEvents) == 0 {
		return nil, fmt.Errorf("list not found: %s", listID)
	}

	state, err := events.ReconstructListState(allEvents)
	if err != nil {
		return nil, fmt.Errorf("failed to reconstruct list state: %w", err)
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
		return nil, fmt.Errorf("failed to marshal list state: %w", err)
	}

	return []mcp.ResourceContents{
		mcp.TextResourceContents{
			URI:      uri,
			MIMEType: "application/json",
			Text:     string(bytes),
		},
	}, nil
}
