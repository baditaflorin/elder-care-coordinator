# Phase 3 Findings Synthesis

Date: 2026-05-10

## Top 5 Usability Gaps

1. Real users cannot load files directly; they must copy text from another app.
2. Users cannot back up or move the complete workspace between browsers/devices.
3. No Settings tab exists, so preferences and destructive reset behavior are hidden or incomplete.
4. Common output actions need too much manual work: copy packet, copy draft, print packet.
5. URL input is absent, and a static Pages app needs honest CORS guidance instead of pretending it can fetch private portals.

## Top 5 Half-Baked Features

| Feature                  | Decision        | Rationale                                                                   |
| ------------------------ | --------------- | --------------------------------------------------------------------------- |
| HTML via Pandoc label    | finish          | The export works, but the label overpromises implementation details.        |
| Local LLM polish         | finish/document | Useful advanced action; dependency limitations must be clear.               |
| Voice note transcription | finish/document | File picker works, but optional remote model support needs honest language. |
| Reset sample             | finish          | It works but needs clear scope and pairing with export/import.              |
| Activity provenance      | finish          | It exists but needs full state export/import to be useful.                  |

## Top 5 Codebase Pain Points

1. `CareWorkspace.tsx` is too large and has too many reasons to change.
2. Persistence has no named migration/import/export boundary.
3. Output actions are ad hoc instead of centralized.
4. Tests cover the engine but not enough complete user paths.
5. Dynamic import boundary casts are implicit rather than documented.

## Top 5 Documentation/Reality Mismatches

1. Backup/export visibility exists only for packets, not full workspace state.
2. "Care artifact review" implies real-data input but only supports typed/pasted text.
3. "HTML via Pandoc" can use fallback HTML.
4. The privacy docs still say v0.1.0.
5. Phase 2 postmortem says activity provenance exists, but state portability does not.

## Fully Usable Means

- A caregiver can start from sample data or their own files/text/clipboard without leaving the app.
- They can review, correct, and apply inferred care items, then reload and continue.
- They can export a packet, copy a draft, print an emergency packet, and back up the full workspace.
- They can import that workspace into a fresh browser and see the same care plan.
- They can understand unsupported paths such as private portal URLs without guessing.

## Phase 3 Success Metrics

- Input audit: all built/claimed rows green; unsupported rows have ADR rationale.
- Output audit: full state export/import, copy, print, and packet downloads are green.
- Controls audit: no production stubs; every visible control does what its label says.
- Codebase audit: no TODO/FIXME/HACK, no source `any`, and unsafe casts only in documented boundary modules.
- Tests: real-data fixture tests, state round-trip tests, settings tests, and smoke test all pass.

## Out Of Scope

- No backend, auth, server sync, or architecture mode change.
- No OCR/image parsing.
- No clinical advice or medication interaction checking.
- No Phase 2 inference engine changes.
- No visual polish beyond labels required for honest controls.
