# ADR 0007: API Versioning Strategy

## Status
Accepted

## Context
As we build the backend for the `TogetherList` application, we need to decide how to handle API changes over time. We want to ensure that as the application evolves, we don't break existing clients (though initially, we control both client and server). We need a strategy that is simple to implement but robust enough to handle future growth.

## Decision
We will use **URL Path Versioning** for our API endpoints.
The version identifier will be included in the URL path, e.g., `/api/v1/lists`.

## Detailed Design
- All API routes will be prefixed with `/api/{version}`.
- The initial version will be `v1`.
- Example: `GET /api/v1/lists`
- If we need to make breaking changes, we will introduce `v2` endpoints (e.g., `/api/v2/lists`) while maintaining `v1` for a deprecation period.
- Non-breaking changes (additive changes) will be made within the current version.

## Consequences
### Positive
- **Explicit**: It is immediately obvious which version of the API a client is using by looking at the URL.
- **Easy to Route**: Load balancers and routers can easily route traffic based on the URL path.
- **Simple Client Implementation**: Clients just need to know the base URL.
- **Easy to Browse**: Developers can easily explore the API in a browser or curl without setting complex headers.

### Negative
- **URL Pollution**: The URL contains "metadata" (the version).
- **Not RESTful Purist**: Some argue that versioning should be in content negotiation headers (HATEOAS), but practically, path versioning is widely accepted and pragmatic.

## Unresolved Issues
- None.
