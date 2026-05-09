# 0064 DRY Consolidation Map

## Status

Accepted

## Context

Output/download/copy/state behavior is scattered through UI handlers. The inference engine is large but locked for Phase 3.

## Decision

Create shared helpers for clipboard, state-file export/import, settings, and UI action errors. Do not refactor the Phase 2 inference engine in this phase.

## Consequences

Completeness work gains single sources of truth without destabilizing the parser.

## Alternatives Considered

- Large parser split: rejected by the "no engine changes" constraint.
- Abstract all UI panels now: rejected because it would be refactor-heavy without direct usability payoff.
