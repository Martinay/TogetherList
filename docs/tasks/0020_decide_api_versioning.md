# Decide API Versioning Strategy

## Goal
Create an ADR that defines how the API will be versioned for future compatibility.

## Scope
- **Directory**: `docs/adr/`
- **Files**: `docs/adr/0007_api_versioning.md`

## Context
- **Current design**: `/api/lists/...` endpoints (from ADR 0003).
- **Question**: Should we version now (`/api/v1/...`) or keep it simple?

## Granular Instructions
- [ ] Research API versioning strategies:
    - URL path versioning (`/api/v1/...`)
    - Header versioning (`Accept: application/vnd.togetherlist.v1+json`)
    - Query parameter (`?version=1`)
    - No versioning (YAGNI for MVP)
- [ ] Evaluate based on:
    - Likelihood of breaking changes
    - Complexity overhead
    - Client compatibility
    - Industry best practices for micro-SaaS
- [ ] Make decision:
    - If versioning: Define the pattern
    - If not: Document why and when to revisit
- [ ] Draft ADR at `docs/adr/0007_api_versioning.md`.

## Definition of Done
- [ ] ADR created with clear decision and rationale.
- [ ] `status.md` updated with new Key Decision.
- [ ] Next Task created if needed.
