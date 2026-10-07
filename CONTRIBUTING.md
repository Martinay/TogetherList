# Contributing

Read AGENTS.md and the repository skills before changing code. Every new or changed user-facing feature must include real end-to-end coverage through the production frontend, Go HTTP server and temporary JSONL event store. Update [the coverage inventory](docs/e2e-coverage.md) in the same PR with the scenarios and exact test names. Include applicable validation and failure behavior, reload/disk persistence, identity and sharing, independent-session collaboration, and offline behavior. Unit tests complement these tests.

Write a failing automated reproduction before fixing a production bug, then make the minimal fix. Never skip, focus, conditionally omit or weaken tests to obtain a passing build. Run the full suite and existing quality checks; repeat E2E to detect flakes. Record exact results and any remaining gaps in the PR checklist. CI installs pinned Chrome/ChromeDriver and runs the complete production suite twice on every PR and main push.

The structural guard checks route/spec inventory, changed-production inventory review, and executed JUnit results with zero skips. It cannot prove arbitrary feature completeness: reviewers must inspect the scenarios and assertions. A refactor with no behavioral impact still updates the inventory with a reasoned explanation of existing coverage. New behavior needs new or updated E2E assertions; a documentation edit alone does not satisfy the policy.

See the inventory for local prerequisites, commands, artifact locations and platform limitations. Do not commit generated coverage, browser downloads, event logs or screenshots.
