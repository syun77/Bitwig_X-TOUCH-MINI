# Progress

## Current task

- Objective: Assign Undo and Redo to buttons 40 and 41.
- Status: Complete.

## Completed

- Read the prior task state and preserved existing working-tree changes.
- Located buttons 40 and 41 in the pressed-button dispatcher; both are currently unused.
- Renamed the button constants to `BTN_UNDO` and `BTN_REDO` and wired them to `Application.undo()` and `Application.redo()`.
- Updated the README button mapping and durable repository knowledge.
- Completed the required final refactoring pass; direct calls through the existing `application` object are the simplest current design.

## Important decisions

- Preserve all pre-existing uncommitted work and limit this change to the two button assignments plus current documentation.

## Files changed

- `PROGRESS.md`
- `script/XToutchMini.control.js`
- `README.md`
- `AGENTS.md`

## Verification

- Passed JavaScript syntax validation with the bundled Node.js runtime.
- Passed `git diff --check`.
- Confirmed Note 40/41 constants and handlers map exactly to Undo/Redo, with no obsolete unused-button names remaining.

## Next actions

- Reload the script in Bitwig Studio and verify Undo/Redo from the third and fourth upper-row buttons.
- Hardware verification remains pending.
