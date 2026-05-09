# Phase 2 Substance State Taxonomy

Date: 2026-05-09

## Intake States

| State             | Trigger                                                   | User exit                                              | UI behavior                                                            |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| idle              | Dashboard loads with no pasted artifact                   | Paste text and review                                  | Shows awaiting artifact state.                                         |
| analyzing         | User starts review                                        | Cancel or wait                                         | Prior analysis is aborted; progress text is visible.                   |
| ready             | Intake engine returns candidates                          | Apply selected, edit text, review again, switch tab    | Shape, confidence, warnings, candidates, and explanations are visible. |
| applied           | User applies selected candidates                          | Review again, switch tabs, edit generated items        | Care plan is saved locally and activity log records the source hash.   |
| cancelled         | User cancels or a newer review supersedes an older review | Review again                                           | Existing care plan remains unchanged.                                  |
| error-recoverable | Parser throws or input exceeds safe handling budget       | Paste a smaller/more complete section and review again | Message states what failed, why, and next step.                        |
| loaded-empty      | Empty paste is reviewed                                   | Paste care content and review again                    | Empty-input warning is visible; no candidates are applied.             |
| loaded-too-large  | Input is above 1 MB                                       | Split document by section                              | Too-large warning is visible and no candidates are generated.          |

## Care Plan States

| State       | Trigger                             | User exit                                  | UI behavior                                                                    |
| ----------- | ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| loading     | IndexedDB/Yjs read in progress      | Wait or reset if load fails                | Top strip says the local plan is loading.                                      |
| ready-saved | Plan loaded and last save succeeded | Continue editing                           | Top strip shows last saved time.                                               |
| save-error  | IndexedDB write fails               | Dismiss, retry by editing, or reset sample | Error banner keeps the user in control; work remains visible.                  |
| exported    | Packet download is requested        | Continue editing                           | Packet includes version, commit, schema, update time, and activity provenance. |

## Defined Concurrency Behavior

- Starting a new review aborts the previous `AbortController`.
- Cancel never mutates the care plan.
- Applying candidates mutates only the selected candidate set and records one activity entry.
- Duplicate stable IDs are ignored on apply, so repeated review/apply does not create duplicate medications, appointments, tasks, correspondence, or notes.
