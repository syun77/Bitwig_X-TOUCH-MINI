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
- The script targets Bitwig Controller API 20, defines one MIDI input and one MIDI output, and supports the X-TOUCH MINI only in MC mode.
- Install the script below Bitwig Studio's user `Controller Scripts` directory, then register `Behringer` / `X-Touch mini` and assign the X-TOUCH MINI ports in Bitwig's Controllers settings.

