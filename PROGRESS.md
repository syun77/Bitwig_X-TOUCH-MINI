# Progress

## Current task

- Objective: Make ALT + encoder 6 change tempo by ±1 BPM per detent.
- Status: Complete.

## Completed

- Read the previous task state and located the encoder rotation dispatch and documentation.
- Confirmed API 21 exposes raw tempo increments through `transport.tempo().incRaw()`.
- Implemented ALT + encoder 6 as a 1 BPM change per encoded tick.
- Reduced the increment from 10 BPM to 1 BPM after hands-on use showed 10 BPM was too coarse.
- Updated the README mapping and durable repository knowledge.
- Completed the required final refactoring pass; the tempo constant, dispatch branch, and helper are narrowly scoped and no duplication or dead code was introduced.

## Important decisions

- Preserve the controller's relative-value magnitude, so accelerated encoder messages change 1 BPM for every encoded tick.
- Keep the encoder-press NeuralNote assignment unchanged; rotation and press mappings are independent.

## Files changed

- `PROGRESS.md`
- `script/XToutchMini.control.js`
- `README.md`
- `AGENTS.md`

## Verification

- Passed JavaScript syntax validation with the bundled Node.js runtime.
- Passed a mocked MIDI routing test: clockwise value `1` produced `+1` BPM and counterclockwise value `66` (two encoded ticks) produced `-2` BPM.
- Passed `git diff --check`.
- Confirmed the README and `AGENTS.md` describe ALT + encoder 6 rotation separately from its press action.

## Next actions

- Reload the controller script in Bitwig Studio and confirm the tempo changes by 1 BPM per physical encoder detent.
