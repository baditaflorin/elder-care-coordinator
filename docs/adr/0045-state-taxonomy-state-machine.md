# 0045 State Taxonomy And State Machine

## Status

Accepted

## Context

Intake can be idle, analyzing, cancelled, empty, useful, partial, or failed.

## Decision

Represent intake state explicitly and document reachable states in `docs/phase2-substance/states.md`. Long analysis uses an abort signal. Starting a new analysis cancels the previous one.

## Consequences

No half-applied or stuck states should be reachable. UI always offers a next action.

## Alternatives Considered

Implicit boolean state was rejected because it cannot express partial/low-confidence outcomes.
