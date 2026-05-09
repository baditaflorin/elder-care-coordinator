# 0043 Domain Vocabulary And UI Language

## Status

Accepted

## Context

Caregivers think in terms of medication directions, appointment reminders, denial letters, and family handoffs, not parser internals.

## Decision

Use caregiver-facing words in UI and errors. Examples: "medication direction," "needs clarification," "appeal deadline," "claim reference," "family handoff," and "source text." Avoid implementation terms such as AST, token, selector, or parse node.

## Consequences

Errors and warnings become actionable without exposing implementation details.

## Alternatives Considered

Developer-oriented diagnostics are kept for `?debug=1` only.
