# Progress

## Current task

- Objective: Upgrade to Controller API 21 and make ALT + encoder 7 zoom explicitly around the playback start position.
- Status: Complete.

## Completed

- Read the prior API investigation and implementation state.
- Updated the script from Controller API 20 to API 21.
- Observed and cached `transport.playStartPosition()` as the explicit zoom anchor.
- Created the arranger horizontal scrollbar model and replaced unspecified-anchor zoom calls with `zoomAtPosition()`.
- Added bounded zoom sensitivity: approximately 1.19× per encoder tick, capped at 2× per MIDI message.
- Updated `README.md` and durable repository knowledge for the API requirement and anchored zoom behavior.
- Completed the required final refactoring pass: removed the obsolete API-version comment, centralized zoom tuning constants, and retained null-safe application actions.

## Important decisions

- Use `transport.playStartPosition()` as the explicit beat-position anchor.
- Use `arranger.getHorizontalScrollbarModel().zoomAtPosition()` from API 21.
- Apply a fixed moderate exponential distance per incoming encoder message rather than passing MC acceleration values directly.

## Files changed

- `PROGRESS.md`
- `script/XToutchMini.control.js`
- `README.md`
- `AGENTS.md`

## Verification

- Passed JavaScript syntax validation with the bundled Node.js runtime.
- Passed `git diff --check`.
- Confirmed API 21 loading, play-start observation, scrollbar initialization, and `zoomAtPosition()` usage with targeted searches.
- Hardware verification in Bitwig Studio with an X-TOUCH MINI remains pending.

## Next actions

- Reload the controller in Bitwig Studio and verify ALT + encoder 7 direction, anchor stability, and sensitivity on hardware.
