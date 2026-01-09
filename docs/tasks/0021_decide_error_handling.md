# Decide Error Handling Strategy

## Goal
Create an ADR that defines a consistent error response format and HTTP status code conventions.

## Scope
- **Directory**: `docs/adr/`
- **Files**: `docs/adr/0008_error_handling.md`

## Context
- **Need**: Consistent error responses for frontend consumption.
- **Considerations**: Error codes, messages, HTTP status mapping.

## Granular Instructions
- [ ] Research error response patterns:
    - RFC 7807 (Problem Details for HTTP APIs)
    - Simple `{ "error": "message" }` pattern
    - Custom structured errors with codes
- [ ] Define standard error response format:
    ```json
    {
      "error": {
        "code": "LIST_NOT_FOUND",
        "message": "The requested list does not exist"
      }
    }
    ```
- [ ] Define HTTP status code conventions:
    - 400: Validation errors
    - 404: Resource not found
    - 409: Conflict (concurrent modification?)
    - 500: Internal server error
- [ ] Define error codes for common scenarios:
    - `LIST_NOT_FOUND`
    - `ITEM_NOT_FOUND`
    - `INVALID_EVENT_TYPE`
    - etc.
- [ ] Draft ADR at `docs/adr/0008_error_handling.md`.

## Definition of Done
- [ ] ADR created with clear decision and rationale.
- [ ] `status.md` updated with new Key Decision.
- [ ] Next Task created if needed.
