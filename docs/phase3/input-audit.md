# Phase 3 Input Pathway Audit

Date: 2026-05-10

Mode: A, GitHub Pages only.

## Status Grid

| Entry point                          | Status before Phase 3 | Evidence                                                                | Decision                                                   |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Paste text into Care Artifact Review | works fully           | Dashboard textarea calls `analyzeCareInput` and applies candidates.     | Keep and test.                                             |
| Paste HTML into Care Artifact Review | works partially       | HTML can be pasted as raw text but tags are not stripped or identified. | Finish with text extraction and format detection.          |
| Paste image/OCR                      | not built             | No OCR dependency or image parser; no claim in UI.                      | Out of scope for Mode A completeness.                      |
| Clipboard read button                | not built             | Browser paste works, but no permission-aware read button.               | Add with fallback messaging.                               |
| Text file upload                     | not built             | No file input for intake text.                                          | Add.                                                       |
| HTML/CSV/Markdown file upload        | not built             | No file input, no extension/magic sniffing.                             | Add format detection and route to text intake.             |
| Multi-file upload                    | not built             | No batching or per-file errors.                                         | Add batch concatenation with progress and file summaries.  |
| Drag-and-drop                        | not built             | No drop zone.                                                           | Add.                                                       |
| Mobile file picker                   | not built             | No file input.                                                          | Add standard `input type=file` with multiple sources.      |
| Folder upload                        | not built             | Not useful for private caregiver documents in v0.3.                     | Permanently out of scope in ADR 0061.                      |
| URL input                            | not built             | GitHub Pages cannot bypass CORS or hold a scraping secret.              | Add honest guidance to paste rendered text/HTML; no fetch. |
| Sample/demo input                    | works partially       | Sample care plan loads, but sample artifact review requires typing.     | Add sample artifact loader.                                |
| Imported care-plan state             | not built             | IndexedDB restores local state, but no user-owned state file import.    | Add state file import.                                     |
| Restored autosave                    | works fully           | IndexedDB/Yjs save/load path exists and is smoke-tested indirectly.     | Keep and add migration tests.                              |
| Deep links                           | works partially       | App loads under Pages base path; no hash-state import.                  | Add small share-link hash for intake text only.            |

## Top Input Gaps

1. A stranger with a real file cannot load it without opening another app and copying text.
2. There is no round-trip state import, so changing browsers/devices starts from sample data.
3. Clipboard permission flow is not explicit.
4. HTML/CSV input is treated as plain text, which is surprising when users export from portals.
5. URL import would be misleading on GitHub Pages; the app needs an honest static-friendly alternative.

## Status After Phase 3

| Entry point                        | Status after Phase 3       | Evidence                                                                                |
| ---------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| Paste text                         | green                      | Care artifact textarea remains wired to review/apply.                                   |
| Paste HTML                         | green                      | User can choose HTML text; tags are stripped before review.                             |
| Paste image/OCR                    | out of scope               | ADR 0061 keeps OCR out of Phase 3.                                                      |
| Clipboard read                     | green                      | Read clipboard button loads text or gives fallback guidance.                            |
| Text file upload                   | green                      | Choose files accepts text-like files and smoke test covers a fixture file.              |
| HTML/CSV/Markdown/JSON file upload | green                      | Format detection and preparation helpers are tested.                                    |
| Multi-file upload                  | green                      | Multiple files are batched with source headers and per-file format summaries.           |
| Drag-and-drop                      | green                      | Drop zone reads the same file pathway as upload.                                        |
| Mobile file picker                 | green                      | Standard file input supports mobile Files/share sources where the browser exposes them. |
| Folder upload                      | out of scope               | ADR 0061 rejects folder import for v0.3.                                                |
| URL input                          | out of scope with guidance | URL-like input returns static Pages/CORS guidance.                                      |
| Sample/demo input                  | green                      | Load sample button fills a realistic transition-of-care artifact.                       |
| Imported care-plan state           | green                      | Settings imports versioned workspace JSON.                                              |
| Restored autosave                  | green                      | IndexedDB/Yjs path remains active.                                                      |
| Deep links                         | green for small artifacts  | Small artifact hash links load into the review textarea.                                |
