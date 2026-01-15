---
id: REQ-0003
status: Implemented
type: Functional
priority: P0
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-15
links:
  adr: []
  requirements: [REQ-0002]
tags: [list, sharing, access, url]
---

# REQ-0003: List Sharing via URL

## Context

The application prioritizes simplicity and accessibility.
Users should be able to share lists by distributing a unique URL.
No authentication or invitation mechanism is required; anyone with the link can access the list.

## Requirement (EARS)

**Pattern:** Ubiquitous

**Statement:**  
The system shall allow any user with the list URL (`/list/<uuid>`) to access and participate in that list.

## Rationale

Link-based sharing eliminates friction:
- No sign-up or login required
- Easy to share via messaging apps, email, or other channels
- Aligns with the "simplicity" goal of the application

The trade-off is reduced access control, which is acceptable for this use case.

## Acceptance Criteria

- Given a user has a valid list URL
- When the user navigates to `/list/<uuid>` in their browser
- Then the list page loads, displaying all items and allowing interaction

### Share Button

- Given a user is viewing a list
- When the user clicks the "Share" button in the header
- Then the browser's native share dialog opens (if available) OR the list URL is copied to the clipboard with "Copied!" feedback

## Verification

- Method: Test
- Evidence: Automated test confirming unauthenticated access to valid list URLs

## Dependencies and Relationships

- Related requirements: REQ-0002 (List Creation)
- Constraining ADRs: None
- Impacted components: Routing, list page, API access control

## Notes

Invalid or non-existent UUIDs should result in a user-friendly error page.
