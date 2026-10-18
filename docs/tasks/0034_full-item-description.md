# 0034: Full item descriptions

Status: Implemented; user acceptance pending.

Scope: `frontend/src/features/view-list/ListItem.tsx`, `frontend/src/test/e2e/item-description.e2e.test.ts`, `frontend/src/test/ListItem.test.tsx`, coverage inventory and this handoff. No backend changes.

Normal (collapsed) list items show the complete description with preserved newlines, dynamic height and wrapping for unbroken text. The containing flex button can shrink within the row. Expanded editable and completed disabled descriptions also show the full text. The textarea measures content when opening and editing, and observes width changes to grow or shrink with wrapping. The 120px textarea and 700px expanded-details caps are removed.

Test-first reproduction: the new real browser/Go/JSONL scenario failed before the fix (16px description height versus at least 208px). Existing add/edit/clear/reload assertions remain; the obsolete assertion requiring truncation was replaced by actual layout checks. The new scenario saves 12 lines and a long unbroken string through the UI, verifies HTTP state, reloads and checks full text, height, whitespace, clipping and card/page bounds at 1280px and 360px.

## Proposed requirement clarification for review

The workflow requires confirmation before updating existing requirements. Proposed EARS statement: “When a list item has a description, the system shall display its complete text with dynamic height, preserved line breaks and wrapping within the item width in both the collapsed preview and the expanded editable or completed disabled description.”

After acceptance, reconcile the first-line preview language in [REQ-0016](../requirements/0016_item_description.md) and two-line preview language in [REQ-0015](../requirements/0015_item_details_view.md). Existing requirement statuses and status kanban remain unchanged pending confirmation. No architectural decision is needed for this local layout fix.

## Handoff

Next step: user review and acceptance of this change and proposed clarification; no additional implementation task is proposed. Do not commit, push, open a PR, merge or deploy.

## Expanded editor regression and verification

The browser regression “autosizes expanded descriptions on opening, viewport resize, edits and completion without clipping details” exercises persisted 35-line content, reopening after reload, narrow/wide resizing, editing growth and shrinking, and completed disabled content with reload. It asserts full content and footer containment beyond 700px without internal scrolling or horizontal page overflow. jsdom receives a local ResizeObserver stub in ListItem unit tests; geometry is verified in the real browser.

Test-first evidence: the other agent's second full-suite run picked up this new test before the autosize fix and reported **75 passed / 1 failed**, with “Full textarea content and details footer must fit without internal scrolling or clipping.” Its first full run, before this regression was added, passed **75/75**. These are pre-extension results, not final whole-suite validation.

Final extension commands, from `frontend/` with the environment in `/tmp/full-description-env.sh`:

- `bun run node_modules/vitest/vitest.mjs run --config vitest.e2e.config.ts src/test/e2e/item-description.e2e.test.ts`: **3/3 passed twice**, 13.06s and 11.98s. No further whole-suite runs.
- `bun run test:run`: **131/131 passed**, 14 files.
- `bun run build`: passed, including TypeScript checking and production bundling.
- `bun run lint`: passed.
- `git diff --check` from the repository root: passed.

Scratch logs: `$TMPDIR/full-description-autosize-{browser,browser-repeat,unit,build,lint}.log`; the pre-fix second full-suite JUnit report was preserved at `$TMPDIR/full-description-before-autosize-results.xml` before targeted verification. Requirements and status acceptance remain pending; no commit/push/PR/deployment was performed.
