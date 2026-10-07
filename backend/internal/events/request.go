package events

import (
	"errors"
	"github.com/google/uuid"
	"net/http"
)

// RequestID uses a validated client operation ID for durable retry deduplication.
func RequestID(r *http.Request) string {
	if id, err := uuid.Parse(r.Header.Get("Idempotency-Key")); err == nil && id.Version() == 4 {
		return id.String()
	}
	return uuid.New().String()
}

// ValidateRequestID rejects malformed retry keys instead of silently losing deduplication.
func ValidateRequestID(w http.ResponseWriter, r *http.Request) bool {
	key := r.Header.Get("Idempotency-Key")
	if key == "" {
		return true
	}
	parsed, err := uuid.Parse(key)
	if err != nil || parsed.Version() != 4 {
		http.Error(w, "Invalid idempotency key", http.StatusBadRequest)
		return false
	}
	return true
}

func WriteAppendError(w http.ResponseWriter, err error, message string) {
	if errors.Is(err, ErrIdempotencyConflict) || errors.Is(err, ErrRevisionConflict) {
		http.Error(w, "Mutation conflict; refresh before retrying", http.StatusConflict)
		return
	}
	http.Error(w, message, http.StatusInternalServerError)
}
