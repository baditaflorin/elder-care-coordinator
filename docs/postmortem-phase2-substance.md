# Phase 2 Substance Postmortem

Date: 2026-05-09

Live site: https://baditaflorin.github.io/elder-care-coordinator/

Repository: https://github.com/baditaflorin/elder-care-coordinator

## Real-Data Pass Rate

Before: 0/10. v1 had no paste/import path and required manual entry.

After: 10/10 real-data fixtures pass `src/features/intake/infer.test.ts`.

| Fixture                       | Before | After |
| ----------------------------- | ------ | ----- |
| 01 clean medication list      | fail   | pass  |
| 02 transition worksheet       | fail   | pass  |
| 03 discharge conflict         | fail   | pass  |
| 04 prescription label sig     | fail   | pass  |
| 05 adversarial sig            | fail   | pass  |
| 06 Medicare Summary Notice    | fail   | pass  |
| 07 insurance denial           | fail   | pass  |
| 08 prior authorization denial | fail   | pass  |
| 09 appointment reminder       | fail   | pass  |
| 10 family chat                | fail   | pass  |

## Top Logic Gaps Closed

1. No ingestion layer: added Care Artifact Review on the dashboard for pasted medication lists, sigs, discharge notes, denials, appointments, and family chat.
2. No medication sig parser: added deterministic parsing for daily, twice daily, three times daily, PRN/as-needed, start/stop/continue, and split label/sig lines.
3. No reconciliation engine: added transition/discharge shape detection, stopped-med warnings, changed-dose warnings, and duplicate stable IDs.
4. No insurance extraction: added denial/prior-authorization extraction for reference, service, denial reason, appeal deadline, supporting-document warnings, draft, and task.
5. No confidence/provenance: every candidate has confidence, warnings, explanations, source lines, stable ID, and exported packets now include app version, commit, schema, updated-at, and intake activity.

## Smart Behaviors Delivered

- First guess on paste: all 10 fixtures produce candidates immediately.
- Confidence instead of silent certainty: ambiguous sigs, stopped meds, timezone text, missing references, and supporting-document needs are surfaced.
- Domain shapes: medication list, prescription sig, discharge reconciliation, insurance denial, prior authorization, appointment reminder, and family chat are recognized.
- Deterministic engine: repeated analysis of the same fixture is byte-identical in the test suite.
- Inspectability: `?debug=1` exposes source hash, schema version, bytes, and matched rules; each candidate has a Why detail.

## Determinism Check

All 10 fixtures pass deterministic output assertions: repeated `analyzeCareInput(input)` serializes to byte-identical JSON.

## Performance

Median fixture time: 1 ms.

P95 fixture time: 42 ms.

Worst real fixture: 42 ms for the appointment reminder.

Huge synthetic input: 151 ms and returns a `too-large` warning with no candidates.

Full details: docs/perf/phase2-intake.md

## Surprises

- The most fragile real input was not the long insurance text; it was split prescription-label text where the drug name and directions appear on adjacent lines.
- Some denial letters are better classified as prior authorization even when they look like generic insurance denials.
- The emergency packet could look authoritative while missing provenance, so export metadata had to be made visible.

## Still Open

1. PDF/image ingestion is still manual paste, not OCR/document upload.
2. Sig parsing is rule-based; it flags ambiguity but does not understand every pharmacy shorthand.
3. Medication reconciliation warns on conflicts but does not present a specialized merge/resolution table.
4. User corrections are not yet learned within the session.
5. Exports preserve activity provenance but not every candidate-level warning after apply.

## Honest Take

It no longer feels like a toy on pasted caregiver artifacts. A stranger can paste messy medication, insurance, appointment, or chat text and get a useful first guess with warnings.

It still feels early when the source is a scanned PDF/photo or when resolving complex medication conflicts. The app is now smart enough to begin the work honestly; it is not yet smart enough to finish every messy care transition without caregiver judgment.
