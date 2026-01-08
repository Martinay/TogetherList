---
status: Accepted
date: 2026-01-09
---

# AD: Use Go for Backend

## Context and Problem Statement

TogetherList requires a backend technology stack that supports:
- Event sourcing architecture with JSONL file storage
- Real-time state synchronization via polling
- Simple, performant API serving the React + Vite frontend
- Minimal operational complexity for a micro-SaaS product
- Long-term maintainability with straightforward deployment

The backend must efficiently handle event appending, stream replay, and state hydration for shared lists.

## Decision Drivers

* **Event Sourcing Compatibility**: Must efficiently append and read JSONL event streams
* **Performance**: Low latency for API responses (< 100ms p95)
* **Simplicity**: Single binary deployment, minimal dependencies
* **Concurrency**: Handle multiple simultaneous list updates safely
* **Developer Velocity**: Balance type safety with development speed
* **Operational Footprint**: Minimal memory usage and easy containerization

## Considered Options

1. Python + FastAPI
2. Node.js + Express
3. Go + net/http (stdlib)

### Cost Evaluation Per Option

#### Option 1: Python + FastAPI

**Building (Development)**:
- Authoring: Excellent DX with type hints and async/await
- Project Scale: Good for small to medium APIs
- Onboarding: Widely known, abundant resources
- AI Assistance: Excellent - well-represented in training data

**Running (Operations)**:
- Runtime: Moderate - async helps but GIL limits true concurrency
- Deployment: Requires Python runtime, virtual environment management
- Maintenance & Debugging: Good tooling (debuggers, profilers)

**Externalities**:
- Interoperability: Rich ecosystem (Pydantic, SQLAlchemy)
- Security: Mature security practices, ASGI middleware

#### Option 2: Node.js + Express

**Building (Development)**:
- Authoring: Familiar JavaScript/TypeScript, fast iteration
- Project Scale: Good for I/O-bound microservices
- Onboarding: Very widely known
- AI Assistance: Excellent - common patterns

**Running (Operations)**:
- Runtime: Good for I/O, single-threaded event loop
- Deployment: Requires Node.js runtime, node_modules
- Maintenance & Debugging: Mature ecosystem

**Externalities**:
- Interoperability: Massive npm ecosystem
- Security: Requires careful dependency auditing

#### Option 3: Go + net/http (stdlib)

**Building (Development)**:
- Authoring: Static typing, explicit error handling, fast compilation
- Project Scale: Excellent for APIs of any size
- Onboarding: Moderate learning curve, but simple patterns
- AI Assistance: Good - well-established idioms

**Running (Operations)**:
- Runtime: Excellent - compiled to native binary, minimal memory (~10-20MB)
- Deployment: Single static binary, no runtime dependencies
- Maintenance & Debugging: Good tooling (pprof, race detector)

**Externalities**:
- Interoperability: Standard library covers most needs (net/http, encoding/json)
- Security: Memory-safe, no dependency sprawl

## Decision Outcome

**Selected: Go + net/http (stdlib)**

Go provides the optimal foundation for TogetherList's backend:

1. **Event Sourcing Fit**: Go's `encoding/json` and file I/O primitives make JSONL handling straightforward. Buffered readers enable efficient stream replay.

2. **Concurrency Model**: Goroutines naturally handle concurrent list access. Mutex-based synchronization protects per-list event files without complexity.

3. **Single Binary Deployment**: Compiles to a ~10MB static binary with zero runtime dependencies. Simplifies containerization and reduces operational burden.

4. **Performance**: Native compilation delivers sub-10ms response times for typical API calls. Minimal memory footprint (~15-20MB under load).

5. **Stdlib Sufficiency**: `net/http` provides production-ready routing and middleware patterns. No framework lock-in or dependency churn.

6. **Right-Sized Complexity**: Type safety prevents runtime errors without excessive boilerplate. Explicit error handling surfaces issues early.

## API Design Strategy

### RESTful Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/lists` | POST | Create new list, return UUID |
| `/api/lists/{uuid}` | GET | Hydrate list state from events |
| `/api/lists/{uuid}/events` | POST | Append new event |
| `/api/lists/{uuid}/events` | GET | Stream events (for polling) |

### Polling Strategy

The frontend polls `/api/lists/{uuid}/events?since={timestamp}` to fetch new events since the last known state. This aligns with the event sourcing model where clients can independently reconstruct state.

### Event Handling

```go
type Event struct {
    ID        string    `json:"id"`
    Type      string    `json:"type"`
    Payload   any       `json:"payload"`
    Timestamp time.Time `json:"timestamp"`
}
```

Events are appended atomically using file locking (`flock`) to ensure consistency under concurrent writes.

## Consequences

* Good, because single binary simplifies deployment (Docker image < 20MB)
* Good, because excellent concurrency handling for real-time updates
* Good, because minimal memory footprint suits cost-sensitive hosting
* Good, because stdlib reduces dependency management overhead
* Good, because static typing catches errors at compile time
* Bad, because steeper initial learning curve than Python/Node
* Bad, because more verbose error handling patterns

## Testing Strategy

| Type | Tool | Purpose |
|------|------|---------|
| Unit | `testing` (stdlib) | Event handlers, state hydration logic |
| Integration | `httptest` (stdlib) | API endpoint behavior |
| E2E | Playwright (via frontend) | Full user journey with backend |

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # Entry point
├── internal/
│   ├── api/
│   │   ├── handler.go       # HTTP handlers
│   │   └── middleware.go    # CORS, logging
│   ├── event/
│   │   ├── store.go         # JSONL read/write
│   │   └── types.go         # Event definitions
│   └── list/
│       └── service.go       # Business logic
├── go.mod
└── go.sum
```

## More Information

- Project vision: `docs/vision.md`
- Frontend decision: `docs/adr/0002_frontend_tech.md`
- Event schema defined in: `docs/vision.md` (Architecture section)
