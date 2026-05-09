# 0040 Real-Data Audit Findings And Substance Metrics

## Status

Accepted

## Context

The v1 app works on curated sample data but cannot ingest real caregiver artifacts. The Phase 2 audit in `docs/phase2-substance/realdata-audit.md` found that users must manually translate medication lists, sigs, discharge orders, denial letters, appointment reminders, and family chats.

## Decision

Use the 10 audited inputs as the grading rubric. Phase 2 must add a deterministic intake engine that produces useful first guesses, confidence, warnings, and provenance before any manual configuration.

## Consequences

Every inference change must be tested against real-data fixtures. No silent wrongness is allowed; low confidence flows to UI and exports.

## Alternatives Considered

Continuing to improve forms was rejected because it leaves the core real-data gap intact.
