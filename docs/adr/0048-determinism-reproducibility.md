# 0048 Determinism And Reproducibility

## Status

Accepted

## Context

Fixture tests require identical input to produce identical normalized output.

## Decision

The intake engine is deterministic: stable sorting, stable IDs from source hash and candidate content, no locale-dependent formatting in normalized output, and timestamps excluded from core inference results. Export metadata accepts explicit generated-at values for reproducibility.

## Consequences

Same input produces byte-identical fixture output.

## Alternatives Considered

Random IDs and current timestamps inside inference were rejected.
