# 0042 Inference Engine

## Status

Accepted

## Context

The app needs first guesses for medications, appointments, insurance correspondence, family notes/tasks, and emergency packet source material.

## Decision

Implement a deterministic rule-based inference engine for Phase 2. It recognizes common shapes: medication list/table, prescription sig, discharge reconciliation, insurance denial/MSN, prior authorization denial, appointment reminder, family chat, and CSV-like rows.

Each candidate includes entity type, normalized fields, stable ID, confidence, source span, warnings, and explanation.

## Consequences

Rule-based parsing is explainable, fast, and testable against fixtures. It will not match every real-world artifact, but it can be honest about uncertainty.

## Alternatives Considered

Local LLM-only parsing was rejected because it is not deterministic enough for Phase 2 fixtures.
