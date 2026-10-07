# Microsoft Clarity analytics

Status: Draft — implementation under review; not accepted or completed.
Scope: `frontend/` and related `docs/` only.
Branch: `feature/clarity-analytics`.

## Requested behavior

Integrate project `yu06fgkw31` with opt-in consent, durable accept/decline, accessible revocation, multilingual disclosure and privacy statement. Exclude private list URLs/content and deny advertising storage. Keep analytics out of development/tests. Preserve backend, unrelated work and task acceptance state. No commit, push or deployment.

## Review artifacts

- [Consent requirement (Proposed)](../requirements/0025_optional-analytics-consent.md)
- [Privacy boundary requirement (Proposed)](../requirements/0026_analytics-privacy-boundary.md)
- [Boundary decision (Proposed)](../adr/0027_public-page-analytics.md)
- [Exact E2E coverage and verification](../e2e-coverage.md)

## Remaining review / next task

Review privacy/a11y and native-device behavior; verify the project's consent/dashboard configuration and masked production recordings before publication. Actual Microsoft ingestion and dashboard settings are outside automated local verification. Explicit user acceptance is still pending. Do not mark this task complete without that acceptance.
