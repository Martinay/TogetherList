# 8. State Synchronization Strategy

Date: 2026-01-14

## Status

Accepted

## Context

The "TogetherList" application requires real-time updates so that when one user adds or modifies an item, other participants see the change reasonably quickly. The application aims for a "Micro-SaaS" vibe with high simplicity and low operational complexity. We are using Azure Container Apps (serverless/scale-to-zero friendly) and a file-based event sourcing backend.

We need a strategy to synchronize state between the client and server that:
1.  Is simple to implement and debug.
2.  Works well with serverless infrastructure (stateless backend preferred).
3.  Provides a "good enough" real-time experience for a shared list.

## Decision

We will implementation **Short Polling** with a default interval of **3 seconds**.

### Protocol Details
1.  **Polling**: The client will send a `GET` request to `/api/v1/lists/{id}/events` every 3 seconds.
2.  **Cursor-based**: The client will include a `since` query parameter with the ID of the last event it successfully processed (e.g., `?since=123`).
3.  **Response**: The server returns an array of events that occurred after the given cursor. If no new events exist, it returns an empty array immediately (stateless, no hanging connections).
4.  **Optimistic Updates**: The frontend will immediately reflect local changes (e.g., adding an item) before confirmation from the server to ensure a snappy feel.

### Why not WebSockets or SSE?
While WebSockets and Server-Sent Events (SSE) provide lower latency:
-   **Infrastructure Complexity**: They require maintaining persistent connections, which can be tricky with serverless scale-to-zero (handling disconnects, timeouts, and "sticky" sessions).
-   **Implementation Overhead**: Requires more complex backend logic (connection pools, heartbeats) and frontend logic (reconnection strategies).
-   **Overkill**: For a shared grocery/todo list, a 3-second delay is acceptable. The critical path is own-user writes, which are handled optimistically.

## Consequences

### Positive
-   **Backend Simplicity**: The backend remains entirely stateless (REST API).
-   **Reliability**: Network interruptions are naturally handled by the next poll attempt.
-   **Debuggability**: Traffic is just standard HTTP requests, easy to inspect in dev tools.

### Negative
-   **Latency**: Events from other users will be delayed by up to 3 seconds.
-   **Chattiness**: Clients generate traffic even when idle (though lightweight). We can mitigate this later with "adaptive polling" (scaling back interval when user is inactive) if cost/battery becomes an issue.
