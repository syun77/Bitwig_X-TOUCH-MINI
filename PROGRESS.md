# Progress

## Current task

- Objective: Determine whether arranger zooming performed with the mouse wheel can be controlled from the Bitwig controller script and explain the available mappings and limitations.
- Status: Complete.

## Completed

- Read the previous task state.
- Verified the zoom methods inherited by `Arranger` from `TimelineEditor` and their API versions.
- Identified the arranger zoom and playback-start-anchored zoom application-action IDs in the installed Bitwig resources.
- Verified that arbitrary-position `ScrollbarModel.zoomAtPosition(position, distance)` was introduced in API 21, while this script targets API 20.

## Important decisions

- Distinguish callable zoom commands from literal mouse-wheel event emulation and mouse-pointer-anchored zoom behavior.

## Files changed

- `PROGRESS.md`
- `AGENTS.md`

## Verification

- Confirmed `arranger.zoomIn()`, `arranger.zoomOut()`, and `arranger.zoomLevel()` are available from API 14.
- Confirmed `arranger_zoom_in`, `arranger_zoom_out`, `zoom_in_around_playback_start_time`, and `zoom_out_around_playback_start_time` display-name entries in the installed resources.
- Confirmed `getHorizontalScrollbarModel()` and `zoomAtPosition()` require API 21.
- Ran `git diff --check` successfully.

## Next actions

- No remaining work; implement a chosen encoder mapping if requested.
