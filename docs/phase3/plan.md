# Phase 3 Completeness Plan

Date: 2026-05-10

Status: accepted by autonomous execution prompt.

## Ranked Picklist

1. #1 File upload for real care artifacts.
2. #2 Format detection for text, HTML, CSV, Markdown, JSON, and state files.
3. #6 Clipboard read with permission fallback.
4. #4 Multi-file/batch input with per-file errors.
5. #7 Sample artifact loader as first-class input.
6. #8 Resume/start fresh clarity.
7. #11 Downloadable full state file.
8. #9 State export/import round-trip.
9. #10 Copy packet and draft to clipboard.
10. #13 Print packet.
11. #12 Small shareable URL for intake text with documented limits.
12. #15 Half-baked feature triage.
13. #16 Finish kept half-baked controls.
14. #18 Settings page with working settings.
15. #19 Help/docs alignment.
16. #20 Extract duplicated output helpers.
17. #23 Shared validation schemas at import/export boundaries.
18. #24 Split the workspace module by extracting intake/settings helpers.
19. #31 One error-handling convention for UI actions.
20. #35 Eliminate unsafe casts outside boundary code.
21. #36 Validate external JSON with zod.
22. #38 Save settings and workspace reliably.
23. #39 Persistence migration policy.
24. #40 Clear-state operations for workspace and settings.
25. #41 Export-then-import state round-trip.
26. #42 README verified feature checklist.
27. #44 Inline help for non-obvious static/CORS controls.
28. #46 Stranger test.
29. #47 Fix top three stranger-test issues.

## Implementation Order

1. Add state/settings/import/export primitives and tests.
2. Add UI pathways: files, drag-drop, clipboard, sample, share, state export/import, print/copy.
3. Adjust docs and labels so claims match reality.
4. Run stranger test and fix top three issues.
5. Bump to v0.3.0, build, smoke, tag, push.

## Success Gate

Phase 3 is done only when a fresh browser can load a real text file, infer and apply care items, export the full workspace, import it into a fresh session, copy/print the packet, and pass the smoke test.
