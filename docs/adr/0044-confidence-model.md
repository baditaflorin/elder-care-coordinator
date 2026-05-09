# 0044 Confidence Model

## Status

Accepted

## Context

The worst failure mode is a polished but wrong medication schedule or insurance draft.

## Decision

Every inferred candidate receives a confidence value from 0 to 1 and a level: low, medium, or high. Confidence is rule-derived from field completeness, domain cues, ambiguity, and conflicts. Low confidence must be visible and exported.

## Consequences

Users correct guesses instead of trusting silent assumptions. Exports can carry unresolved warnings.

## Alternatives Considered

Binary valid/invalid was rejected because real caregiver text is often partially useful.
