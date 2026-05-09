# 0047 Error Taxonomy And Messaging

## Status

Accepted

## Context

Errors must help caregivers recover without losing work.

## Decision

All intake errors include what failed, why in domain terms, and now what. Errors are categorized as recoverable, needs-clarification, unsupported, too-large, empty, or fatal.

## Consequences

Recoverable errors keep input text and candidates intact. Fatal errors should be rare and tested.

## Alternatives Considered

Raw exceptions in UI were rejected.
