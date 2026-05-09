# 0041 Input Robustness And Normalization Policy

## Status

Accepted

## Context

Caregiver inputs arrive as copied PDF text, CSV fragments, chat logs, smart quotes, non-breaking spaces, CRLF, partial text, and broken lines.

## Decision

Normalize all intake text at the boundary: remove BOM, normalize Unicode to NFKC, replace smart punctuation with ASCII, collapse non-breaking spaces, preserve line boundaries, normalize CRLF/LF, strip bidirectional control characters, and cap processing with a documented size budget.

## Consequences

The parser receives predictable text while retaining original source text for provenance. If input is empty, huge, or structurally broken, the engine returns domain warnings rather than throwing.

## Alternatives Considered

Letting each parser handle raw text was rejected because it causes inconsistent failures and non-determinism.
