# Phase 3 Output Pathway Audit

Date: 2026-05-10

## Status Grid

| Exit path                          | Status before Phase 3     | Evidence                                                  | Decision                                                           |
| ---------------------------------- | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| Emergency packet Markdown download | works fully               | `downloadText('emergency-packet.md', markdown)` is wired. | Keep and test.                                                     |
| Emergency packet HTML download     | works fully with fallback | Pandoc path falls back to local markdown HTML.            | Rename copy to describe the real behavior.                         |
| Encrypted age packet download      | works fully               | Passphrase encryption downloads armored text.             | Keep.                                                              |
| Insurance draft text download      | works fully               | Letter panel downloads `insurance-draft.txt`.             | Keep.                                                              |
| Copy-to-clipboard for draft/packet | not built                 | No clipboard buttons.                                     | Add.                                                               |
| Print-friendly packet              | works partially           | HTML export can be opened manually, but no print button.  | Add print button.                                                  |
| Downloadable full state file       | not built                 | No complete user-owned backup export.                     | Add versioned JSON export.                                         |
| Import exported state file         | not built                 | No state import, so round-trip fails.                     | Add and test.                                                      |
| CSV export                         | not claimed               | No CSV claim in README/UI.                                | Out of scope.                                                      |
| API/curl-ready output              | not claimed               | Mode A app has no API.                                    | Out of scope.                                                      |
| Screenshot export                  | not claimed for users     | Dev screenshot script exists only for docs.               | Out of scope.                                                      |
| Shareable URL                      | not built                 | No small hash link.                                       | Add for small intake text only; state data is too sensitive/large. |
| Embed code                         | not claimed               | Not a widget product.                                     | Out of scope.                                                      |

## Top Output Gaps

1. Users cannot back up and restore their complete care workspace.
2. The most common real output action, copy/paste into email or portal, requires manual selection.
3. Printing the emergency packet requires downloading or browser gymnastics.
4. Share links need explicit size/privacy limits rather than silent failure.

## Status After Phase 3

| Exit path                          | Status after Phase 3      | Evidence                                                               |
| ---------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| Emergency packet Markdown download | green                     | Existing Markdown button retained.                                     |
| Emergency packet HTML download     | green                     | Renamed HTML export; fallback remains.                                 |
| Encrypted age packet download      | green                     | Existing passphrase export retained.                                   |
| Insurance draft text download      | green                     | Existing download retained.                                            |
| Copy draft/packet                  | green                     | Clipboard copy buttons added with user-safe errors.                    |
| Print packet                       | green                     | Print packet opens printable HTML and invokes browser print.           |
| Downloadable full state file       | green                     | Settings exports `elder-care-state.v1` JSON.                           |
| Import exported state file         | green                     | Settings imports the same JSON; smoke test covers export-reset-import. |
| CSV export                         | out of scope              | Not claimed.                                                           |
| API/curl-ready output              | out of scope              | Mode A has no API.                                                     |
| Screenshot export                  | out of scope              | Dev-only screenshot script remains.                                    |
| Shareable URL                      | green for small artifacts | Hash link supports small intake text; large state uses JSON file.      |
| Embed code                         | out of scope              | ADR 0062 rejects it.                                                   |
