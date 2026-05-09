# 0046 Performance Budgets

## Status

Accepted

## Context

Real copied documents can be large, and UI must remain responsive.

## Decision

Budgets:

- median fixture intake under 1 second
- p95 under 3 seconds
- warn above 250 KB
- refuse above 1 MB in v0.2.0 with a domain error and next step
- cancellation available while analyzing

Measurements are recorded in `docs/perf/phase2-intake.md`.

## Consequences

Phase 2 favors fast deterministic parsing over heavy model inference.

## Alternatives Considered

Parsing unlimited text on the main thread was rejected.
