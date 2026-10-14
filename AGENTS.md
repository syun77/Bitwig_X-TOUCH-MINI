# Repository Working Instructions

## Project purpose

- This repository develops the controller script that integrates the BEHRINGER X-TOUCH MINI MIDI controller with Bitwig Studio.
- Evaluate architecture, implementation, testing, documentation, and naming in the context of reliable X-TOUCH MINI control of Bitwig Studio.

## Persistent project knowledge

- During every task, proactively record durable, repository-specific knowledge in this `AGENTS.md` file as soon as it becomes useful for future work.
- Examples include required commands, architectural constraints, device or environment quirks, non-obvious conventions, verified troubleshooting steps, and recurring pitfalls.
- Keep additions concise, factual, and reusable. Do not add temporary observations, guesses, secrets, credentials, personal data, or information already obvious from the code.
- Update or remove stale entries when later work proves them inaccurate.

## Resumable progress

- Maintain the current task state in the repository-root `PROGRESS.md` so work can resume after the session or context is lost.
- Read `PROGRESS.md` before starting or resuming work.
- Update it at the start of a task, after every meaningful milestone or decision, before risky or lengthy operations, whenever work becomes blocked, and before ending a turn with unfinished work.
- Record the objective, current status, completed work, important decisions and reasons, files changed, verification performed and results, blockers, and the exact next actions.
- Keep the file concise and replace obsolete task state instead of accumulating a full chat transcript.
- When a task is complete, mark it complete and leave a short final summary plus any useful follow-up items. Do not claim completion until relevant verification has passed or the missing verification is explicitly documented.
- Never store secrets, credentials, tokens, personal data, or other sensitive material in `PROGRESS.md`.

## Development policy

- This project is under active development and does not require backward compatibility unless a later user request explicitly says otherwise.
- Prefer the cleanest current design, including breaking changes, over compatibility shims, deprecated paths, transitional adapters, or preservation of obsolete APIs.
- When changing a design or interface, update every affected implementation, caller, test, fixture, configuration, documentation file, and example to the new form in the same task. Remove superseded code instead of leaving parallel legacy behavior.
- Comments and documentation must describe only the current behavior and rationale. Do not leave change-history comments, migration notes, commented-out old code, or annotations such as "previously," "legacy," or "changed from."
- After completing the requested implementation and its verification, always perform a dedicated final refactoring pass. In that pass, remove duplication and dead code, improve names and boundaries, simplify control flow, update comments and documentation, and rerun relevant verification.
- Treat the refactoring pass as part of task completion, not as an optional follow-up. Record it and its verification in `PROGRESS.md`.

## Learned repository knowledge

- The existing Bitwig controller script is stored under the repository-root `script/` directory.
- The current script entry file is `script/XToutchMini.control.js`. Use the exact existing filename unless a task intentionally renames it and updates every affected reference.
- The script targets Bitwig Controller API 21, defines one MIDI input and one MIDI output, and supports the X-TOUCH MINI only in MC mode.
- Install the script below Bitwig Studio's user `Controller Scripts` directory, then register `Behringer` / `X-Touch mini` and assign the X-TOUCH MINI ports in Bitwig's Controllers settings.
- Bitwig shortcut actions that lack dedicated API methods can be invoked through `application.getAction(actionId).invoke()`. Enumerate the version-specific callable IDs with `application.getActions()`; localization files are useful for searching display names but are not the authoritative runtime list. The play-start grid-step action IDs are `move_playback_start_time_one_step_backward` and `move_playback_start_time_one_step_forward`.
- ALT + encoder 7 observes `transport.playStartPosition()` and passes that beat position to the API 21 `arranger.getHorizontalScrollbarModel().zoomAtPosition()` method for deterministic anchored zoom. Do not assume localization keys such as `zoom_in_around_playback_start_time` are callable application-action IDs: `Application.getAction()` can return `null`.
- ALT + encoder 6 changes project tempo by 1 BPM per encoder tick through `transport.tempo().incRaw()`.
- ALT + encoder 6 inserts the NeuralNote VST3 device at the end of the selected device chain using ID `ABCDEF019182FAEB447241754E524E54`.
- ALT + encoder 5 inserts the Scaler 3 VST3 device at the end of the selected device chain using ID `ABCDEF019182FAEB53634D7353636C33`.
- Modifier handling is intentionally sparse: SHIFT takes precedence over ALT; specialized encoder rotations are SHIFT + encoder 8 and ALT + encoders 6/7/8, while other modified rotations fall through to Remote Controls. Most modified button combinations have no distinct assignment.
- The Solo observer must clear `pendingShowSolo` after showing a controller-initiated notification. Clearing `pendingShowMute` instead leaves Solo notifications permanently armed and can suppress a pending Mute notification.
- The selected-track Mute state is stored in the declared `isMute` variable; both its observer and LED update must use that name so the script does not rely on an implicit global.
- SHIFT + LAYER A/B selects the previous/next device. Popup-browser candidate navigation has priority while the browser is open; unmodified LAYER A/B continues to select the previous/next track.
- `CursorDevice.selectPrevious()` / `selectNext()` traverse siblings in the current device chain only; they do not flatten nested slots or layers. Hierarchy changes require `selectParent()` or an explicit entry method such as `selectFirstInSlot(slotName)`.
- Bitwig's bundled Maschine JAM script treats device navigation as two axes: previous/next sibling, plus explicit parent/first-slot entry. It observes slot names and enters `currentSlotList[0]`; this avoids pretending that the API supplies a built-in flattened tree traversal.
- ALT + LAYER A selects the parent device; ALT + LAYER B selects the first device in the current device's first reported slot. SHIFT still takes precedence over ALT, and popup-browser navigation takes priority over both.
- Upper-row MC mode notes 40 and 41 invoke `Application.undo()` and `Application.redo()`, respectively.
- Controller API 21 exposes playback-follow state only on `Arranger`; `DetailEditor` / `TimelineEditor` have no equivalent follow property or action. Bitwig 6.0.11 runtime testing also found no callable Detail Editor follow command through `application.getAction()` or `application.getActions()`, including action ID, name, and menu-text searches. Do not implement SHIFT + follow unless a future Bitwig version exposes a supported action.

