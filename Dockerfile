# ==============================================================================
# Stage 1: Build Frontend
# ==============================================================================
FROM oven/bun:latest AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY frontend/ ./

# Build production bundle
RUN bun run build

# ==============================================================================
# Stage 2: Build Backend
# ==============================================================================
FROM golang:1.25-alpine AS backend-build

WORKDIR /app/backend

# Install build dependencies

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source files
COPY backend/ ./

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /server ./cmd/server

# ==============================================================================
# Stage 3: Runtime
# ==============================================================================
FROM alpine:3.19

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy binary from backend build
COPY --from=backend-build /server /app/server

# Copy frontend assets from frontend build
COPY --from=frontend-build /app/frontend/dist /app/static

# Create data directory and set permissions
RUN mkdir -p /data && chown -R appuser:appgroup /data /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PORT=8080
ENV STATIC_DIR=/app/static
ENV DATA_DIR=/data

# Expose port
EXPOSE 8080

# Health check (wget is available in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the server
CMD ["/app/server"]
