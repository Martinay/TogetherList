---
status: Proposed
date: 2026-10-07
deciders: Pending user review
---

# AD: Durable browser snapshots and ordered idempotent replay

## Context and Problem Statement

Previously loaded shared lists must remain usable without connectivity, including reloads. A lost response must not create duplicate items, and reconnecting must not silently overwrite another participant's edits. The existing REST API stores append-only JSONL events and has no authentication.

## Decision Drivers

- Preserve pending changes across reload and retry.
- Keep the existing REST/event-sourcing architecture and dependency pins.
- Make conflicts visible and avoid automatic destructive resolution.
- Support the existing list and item actions, identity selection, and translations.

## Considered Options

1. Atomic localStorage list records, Web Locks, and event IDs for idempotency.
2. IndexedDB records and a dedicated synchronization API.
3. Service-worker HTTP response caching alone.

### Option 1 cost evaluation

**Building (Development)**: Small authoring scope; fits project scale; familiar browser APIs simplify onboarding and AI assistance.

**Running (Operations)**: No additional infrastructure or deployment service; synchronous storage and serialized requests limit scale; debugging uses browser storage and the existing JSONL logs.

**Externalities**: Works with existing REST clients; requires secure contexts and Web Locks for safe editing across tabs; data remains readable by scripts on this origin, as existing identities already are.

### Option 2 cost evaluation

**Building (Development)**: More transaction/schema and protocol authoring; scales better to large datasets; onboarding and AI assistance require understanding migration and transaction lifetimes.

**Running (Operations)**: No database server required, but synchronization API deployment and migration/debugging costs are higher; asynchronous storage avoids blocking the UI.

**Externalities**: Broad browser interoperability; transactional isolation is stronger; the same origin-script data-access security constraints apply.

### Option 3 cost evaluation

**Building (Development)**: Least authoring; familiar caching simplifies onboarding and AI assistance, but cannot meet durable mutation requirements at this project's scale.

**Running (Operations)**: No extra service; low runtime cost, but opaque response-cache debugging and invalidation increase maintenance effort.

**Externalities**: Good static-resource interoperability; risks caching error responses or stale API state; cannot provide creation idempotency or conflict safety.

## Decision Outcome

Propose option 1 for the current small-list product. Each list record contains the server snapshot and its ordered outbox in one atomic storage write. Separate Web Locks serialize short storage transactions and coordinate replay across tabs. Fetches run outside the storage lock; each acknowledgement rereads the current queue before removing only its matching head. Version checks reject refreshes that started before intervening writes. Concurrent replay calls share one in-flight promise, and other tabs skip an occupied replay lock rather than queue background runs. Only lists with acknowledged edits are refreshed by replay. List edits require a secure context and Web Locks. Unsupported browsers remain read-only for existing lists, with a persistent translated support notice even online; they never write snapshots or replay outboxes. HTTPS is required in production (localhost is suitable for local testing). No new dependency or version pin is required.

Queued field changes are projected over server snapshots, including polling results. Replay first reads fresh state and compares the edited field with the original value. A same-field change pauses the list queue. An `If-Match` event revision also prevents races between that read and append. Other lists can continue syncing. Conflict recovery shows saved/shared values and explicitly applies retained changes over current shared values. Rejected operations show their HTTP status and server error detail. Non-conflict permanent rejections are not retried unchanged. Confirmed discard removes the failed operation and edits dependent on its failed item creation, retains independent later operations, and rebases their expected field values over the retained base. Users can then submit corrected changes through the usual editors with new UUIDs.

Operation UUIDs remain stable through retry. The event store checks IDs and payloads under the same exclusive file lock used for append and fsyncs successful writes. Matching retries succeed without another event; mismatched reuse and revision changes return 409. Added item IDs equal their operation UUID; online list creation also uses a stable wizard request UUID.

A production build manifest precaches the SPA entry, built JS/CSS, and all supported language files. The service worker handles static assets and navigation fallback only; API requests and unsuccessful responses are never cached.

## Consequences

- Good: Offline reads, supported edits, identity selection, and reload work after shell installation and list loading.
- Good: Retries preserve operation IDs, permanent errors preserve the queue, and unrelated field edits can merge.
- Bad: localStorage quota, browser data eviction/clearing, and origin script access remain constraints. Storage failures are visible and reject edits.
- Bad: Synchronization requires an open app tab. Requests are serialized with 10-second timeouts and capped exponential retry delays of up to 60 seconds.
- Bad: Large snapshots and full JSONL scans per append have scaling costs. IndexedDB and an indexed idempotency store may be needed later.
- Bad: New list creation requires connectivity. Sharing a locally added item/list update does not make it available remotely before sync.

## More Information

- [State synchronization ADR](0008_state_sync_strategy.md)
- [Offline access requirement](../requirements/0020_offline-list-access.md)
- [Durable edits requirement](../requirements/0021_durable-offline-edits.md)
- [Replay requirement](../requirements/0022_safe-offline-replay.md)
- [Offline shell requirement](../requirements/0023_offline-app-reload.md)
