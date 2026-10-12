# Progress

## Current task

- Objective: Document installation and all currently implemented controller-script features in `README.md`.
- Status: Complete.

## Completed

- Read the existing README and the complete `script/XToutchMini.control.js` implementation.
- Identified the MC-mode MIDI mappings, Remote Controls behavior, transport and track controls, popup-browser behavior, LED feedback, and fixed device-insertion assignments.
- Rewrote `README.md` with prerequisites, OS-specific installation paths, MC-mode setup, Bitwig registration, complete control mappings, fixed device assignments, and current constraints.
- Added concise installation and compatibility facts to `AGENTS.md` for future repository work.
- Completed the required final refactoring pass: clarified SHIFT encoder behavior, page notifications, and reserved ALT assignments; no further structural changes were needed.

## Important decisions

- Document only behavior present in the current script, including its MC-mode requirement and personalized plug-in assignments.
- Separate normal, SHIFT, ALT, and popup-browser operations so hardware usage is easy to scan.

## Files changed

- `PROGRESS.md`
- `README.md`
- `AGENTS.md`

## Verification

- Compared every documented control and device assignment against `script/XToutchMini.control.js`.
- Verified the installation paths and MC-mode activation procedure against the official Bitwig and BEHRINGER documentation linked from the README.
- Ran `git diff --check` successfully.
- Checked the README heading structure and critical script filename/controller identifiers successfully.

## Next actions

- No remaining work for this task.
