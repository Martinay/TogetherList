---
status: Accepted
date: 2026-01-14
---

# AD: Use RFC 7807 (Problem Details) for Error Handling

## Context and Problem Statement

TogetherList requires a consistent and predictable way to return error information to the frontend client. An ad-hoc approach (e.g. sometimes returning string, sometimes `{error: string}`, sometimes `{msg: string}`) leads to fragile frontend code and difficult debugging.

We need a standard format that:
1.  Is machine-readable (for automated retries/handling).
2.  Is human-readable (for debugging).
3.  Can distinguish between the "type" of error (e.g. Validation Error) and the specific instance.

## Decision Drivers

*   **Standardization**: Reduce "reinventing the wheel" and cognitive load for new developers.
*   **Extensibility**: Ability to add extra fields (like validation failure lists) without breaking the schema.
*   **Interoperability**: Standard clients and tools recognize the format.
*   **Completeness**: Separation of broad error category (`type`) vs specific detail (`detail`).

## Considered Options

1.  **Ad-hoc / Plain Text**: Returning 400 with `Bad Request` body.
    *   *Cons*: Not parseable; user-unfriendly.
2.  **Custom JSON Envelope**: `{ "error": { "code": "...", "message": "..." } }`.
    *   *Pros*: Simple, concise.
    *   *Cons*: Non-standard; requires custom documentation and client parsing logic.
3.  **RFC 7807 (Problem Details)**: Standard JSON object with `type`, `title`, `status`, `detail`, `instance`.
    *   *Pros*: The industry standard for HTTP APIs.
    *   *Cons*: Slightly more verbose.

## Decision Outcome

**Selected: RFC 7807 (Problem Details)**

We will use the standard `application/problem+json` content type.

### Format Specification

All error responses of 4xx and 5xx MUST follow this structure:

```json
{
  "type": "https://togetherlist.com/probs/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "The list with ID '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' was not found.",
  "instance": "/lists/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-01-14T12:00:00Z"
}
```

**Fields:**
*   `type`: (String) A URI reference that identifies the problem type. Ideally points to human-readable documentation.
*   `title`: (String) A short, human-readable summary of the problem type.
*   `status`: (Number) The HTTP status code.
*   `detail`: (String) A human-readable explanation specific to this occurrence.
*   `instance`: (String) A URI reference that identifies the specific occurrence of the problem.

**Extensions:**
We may add extension members for specific needs, such as validation errors:

```json
{
  "type": "https://togetherlist.com/probs/validation-error",
  "title": "Validation Error",
  "status": 400,
  "errors": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

## Consequences

*   **Good**: Frontend can use a single standard error parser.
*   **Good**: Clear separation between "what happened" (`title`) and "why it happened" (`detail`).
*   **Good**: Ready for future constraints (e.g. automated docs).
*   **Bad**: Slightly more verbose usage in the Go backend (requires constructing the struct).
