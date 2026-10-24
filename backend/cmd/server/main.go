package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/cors"

	"backend/internal/features/additem"
	"backend/internal/features/assignitem"
	"backend/internal/features/completeitem"
	"backend/internal/features/createlist"
	"backend/internal/features/edititemdescription"
	"backend/internal/features/mcpserver"
	"backend/internal/features/renameitemtitle"
	"backend/internal/features/renamelist"
	"backend/internal/features/viewlist"
	"backend/internal/observability"
)

func setupRoutes() http.Handler { return setupRoutesWithTelemetry(nil) }

func setupRoutesWithTelemetry(telemetry *observability.Telemetry) http.Handler {
	mux := http.NewServeMux()
	var patterns []string
	handle := func(pattern string, handler http.Handler) {
		patterns = append(patterns, pattern)
		mux.Handle(pattern, handler)
	}
	handleFunc := func(pattern string, handler http.HandlerFunc) { handle(pattern, handler) }
	handleFunc("GET /health", healthHandler)
	handleFunc("POST /api/v1/list/create", createlist.Handler)
	handleFunc("GET /api/v1/list/{id}", viewlist.Handler)
	handleFunc("PUT /api/v1/list/{id}/name", renamelist.Handler)
	handleFunc("POST /api/v1/list/{id}/items", additem.Handler)
	handleFunc("PUT /api/v1/list/{id}/items/{itemId}/title", renameitemtitle.Handler)
	handleFunc("PUT /api/v1/list/{id}/items/{itemId}/description", edititemdescription.Handler)
	handleFunc("PUT /api/v1/list/{id}/items/{itemId}/completed", completeitem.Handler)
	handleFunc("PUT /api/v1/list/{id}/items/{itemId}/assigned-to", assignitem.Handler)

	// API misses must not fall through to the frontend SPA.
	handleFunc("/api/", http.NotFound)

	// Model Context Protocol (MCP) server endpoints
	mcpServer := mcpserver.NewServer(nil)
	handle("/api/v1/mcp", mcpServer)
	handle("GET /api/v1/mcp/sse", mcpServer.SSEServer().SSEHandler())
	handle("POST /api/v1/mcp/messages", mcpServer.SSEServer().MessageHandler())

	// MCP route aliases for convenience
	handle("/mcp", mcpServer)
	handle("GET /mcp/sse", mcpServer.SSEServer().SSEHandler())
	handle("POST /mcp/messages", mcpServer.SSEServer().MessageHandler())

	// Serve frontend SPA from STATIC_DIR if configured.
	// Bot-rendering middleware serves pre-rendered HTML to AI/search crawlers.
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir != "" {
		spaHandler := newSPAHandler(staticDir)
		handle("/", newBotRenderHandler(spaHandler, staticDir))
		log.Print("Serving frontend assets")
	}

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Idempotency-Key", "If-Match"},
		AllowCredentials: true,
	})

	return telemetry.Wrap(c.Handler(mux), mux, patterns...)
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	cfg, err := observability.FromEnv()
	if err != nil {
		return err
	}
	telemetry, err := observability.New(ctx, cfg)
	if err != nil {
		return err
	}
	defer func() {
		flushCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := telemetry.Shutdown(flushCtx); err != nil {
			log.Print("Telemetry flush incomplete")
		}
	}()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           setupRoutesWithTelemetry(telemetry),
		BaseContext:       func(net.Listener) context.Context { return ctx },
		ReadHeaderTimeout: 3 * time.Second,
		ErrorLog:          log.New(observability.SafeDiagnostics{}, "", 0),
	}
	result := make(chan error, 1)
	go func() { result <- server.ListenAndServe() }()
	log.Print("Server starting")
	select {
	case err := <-result:
		if !errors.Is(err, http.ErrServerClosed) {
			return errors.New("HTTP server failed")
		}
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			_ = server.Close()
		}
		<-result
	}
	return nil
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
