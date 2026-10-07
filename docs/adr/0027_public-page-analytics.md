---
status: Proposed
date: 2026-10-07
deciders: User review pending
---

# AD: Restrict Clarity to fresh public landing documents

## Context and Problem Statement

Project `yu06fgkw31` is requested for product improvement. List URLs are access capabilities; the landing page can contain saved-list links. Consent denial alone permits cookieless collection, and DOM masking does not mask all URLs.

## Decision Drivers

Explicit opt-in, revocation, private URL protection, multilingual disclosure, low maintenance and no changes to backend behavior.

## Considered Options

1. Track every SPA route with masking and URL configuration.
   - Building (Development): More route guards and URL rewriting; SDK URL coverage is incomplete.
   - Running (Operations): Larger audit surface and ongoing dashboard configuration.
   - Externalities: Unacceptable exposure risk for secret paths, clicked URLs and referrers.
2. Restrict to fresh clean public landing documents (selected implementation, review pending).
   - Building (Development): Small allowlist, persisted consent UI and native creation navigation.
   - Running (Operations): No new backend service or dependency; smaller analytics sample, consent/dashboard configuration still needs owner verification.
   - Externalities: Private workflows excluded; root masking and referrer policy provide additional protection. Third-party analytics still shares public interaction data after consent.
3. Omit analytics entirely.
   - Building (Development): Least code, disclosure/control work unnecessary.
   - Running (Operations): No analytics costs or upkeep; no product usage insights.
   - Externalities: Best isolation, but does not meet the requested analytics integration.

## Decision Outcome

Implement option 2 in the requested frontend scope, pending explicit acceptance. No status or requirement is accepted by this implementation.

Eligibility is fixed at module initialization and rechecked at loading: pathname `/`, no query/fragment, referrer empty or same-origin clean `/` or `/privacy`, storage accessible and no `togetherlist:offline:` records. Clarity is production-mode only; E2E builds use production assets in `e2e` mode without loading the external SDK. No identify or custom-tag API is used. The app root uses `data-clarity-mask="True"`; saved-list content cannot appear in a recording document. Creation uses full document navigation from landing. Privacy links use native navigation and no referrer. The SPA has a global no-referrer policy.

Acceptance queues `consentv2` with analytics granted and ads denied before script loading. Decline clears first-party Clarity cookies. Loaded recording documents receive denied consent and `stop`, then reload; failed decline persistence navigates to excluded `/privacy` instead. Stored changes in other tabs terminate a recording document. No permission is inferred from use of the site.

## Consequences

- Product insights cover new/clean landing-page visits only; private lists, creation, privacy pages, cached-list homes, external referrers and SPA returns are excluded.
- Root text masking reduces replay readability but preserves interaction metrics.
- Full creation navigation adds a shell load; the offline service worker still handles navigation.
- Consent is browser-local, not a server identity. Existing shared-list persistence and collaboration are unaffected.
- Third-party cookies cannot be directly deleted by this origin. Revocation cannot retract data already collected under consent.
- Project owner should configure required cookie consent, verify advertising settings and review masked production recordings before publication; no dashboard changes or deployment performed here.

## Research

Reviewed 2026-10-07:
- [Microsoft disclosure guidance](https://learn.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure): tailored for product improvement, without claiming an Advertising integration.
- [Consent V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2): recommended API; denied consent may still permit cookieless recording.
- [Masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking): explicit mask attributes and scope.
- [FAQ URL masking limitations](https://learn.microsoft.com/en-us/clarity/faq): page URL parameters require support configuration; referrer and clicked URLs are not covered. Thus private routes are excluded instead of relying on URL masking.
