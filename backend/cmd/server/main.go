package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/rs/cors"

	"backend/internal/features/additem"
	"backend/internal/features/createlist"
	"backend/internal/features/renameitemtitle"
	"backend/internal/features/viewlist"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("POST /api/v1/list/create", createlist.Handler)
	mux.HandleFunc("GET /api/v1/list/{id}", viewlist.Handler)
	mux.HandleFunc("POST /api/v1/list/{id}/items", additem.Handler)
	mux.HandleFunc("PUT /api/v1/list/{id}/items/{itemId}/title", renameitemtitle.Handler)

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
