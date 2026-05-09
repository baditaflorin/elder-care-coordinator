# Phase 3 Controls Audit

Date: 2026-05-10

## Control Status

| Control                  | Status before Phase 3                     | Evidence                                                                          | Decision                                                 |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Star on GitHub           | works fully                               | Header anchor opens repo.                                                         | Keep.                                                    |
| Support via PayPal       | works fully                               | Header anchor opens PayPal.                                                       | Keep.                                                    |
| Tab buttons              | works fully                               | Local tab state changes panels.                                                   | Keep.                                                    |
| Dismiss error            | works fully                               | Clears error string.                                                              | Keep.                                                    |
| Confirm medication dose  | works fully                               | Updates `lastConfirmedAt` and caregiver.                                          | Keep.                                                    |
| Run DuckDB report        | works fully                               | Lazy-loads DuckDB and shows fallback engine.                                      | Keep.                                                    |
| Care artifact Review     | works fully for text                      | Calls deterministic intake engine.                                                | Extend with files/clipboard.                             |
| Cancel review            | works fully                               | Aborts current controller.                                                        | Keep.                                                    |
| Candidate checkboxes     | works fully                               | Controls selected candidate IDs.                                                  | Keep.                                                    |
| Apply selected           | works fully                               | Applies selected candidates and logs activity.                                    | Keep and cover in smoke.                                 |
| Remove medication        | works fully                               | Removes by ID.                                                                    | Keep.                                                    |
| Add medication           | works fully                               | Adds medication from form.                                                        | Keep.                                                    |
| Remove appointment       | works fully                               | Removes by ID.                                                                    | Keep.                                                    |
| Add appointment          | works fully                               | Adds appointment from form.                                                       | Keep.                                                    |
| Topic select             | works fully but unsafe cast               | Updates correspondence topic.                                                     | Replace with schema parse.                               |
| Add voice note           | works partially                           | Depends on remote pinned ESM and browser support; fallback error is user-visible. | Keep; label stays explicit.                              |
| Draft letter             | works fully                               | Local deterministic fallback draft.                                               | Keep.                                                    |
| Local LLM polish         | works partially                           | Depends on remote pinned ESM/model; errors surface.                               | Keep as advanced action; documentation must be honest.   |
| Insurance draft Download | works fully                               | Downloads current draft.                                                          | Keep and add copy.                                       |
| Packet Markdown          | works fully                               | Downloads markdown.                                                               | Keep.                                                    |
| HTML via Pandoc          | works but label is misleading             | Falls back to local HTML if Pandoc fails.                                         | Rename to HTML export.                                   |
| Encrypt with age         | works fully                               | Downloads encrypted armored packet.                                               | Keep.                                                    |
| Generate age recipient   | works fully                               | Generates keys client-side.                                                       | Keep.                                                    |
| Add family note          | works fully                               | Adds note to local plan.                                                          | Keep.                                                    |
| Reset sample             | works fully but destructive scope unclear | Clears IndexedDB and restores sample; settings not included.                      | Rename and pair with state export/import/settings reset. |

## Control Gaps

1. No Settings tab even though Phase 3 bar requires one.
2. No explicit import/export controls for the full workspace.
3. Some labels promise implementation details instead of user outcomes.
4. One topic control uses a TypeScript cast instead of a boundary parser.
