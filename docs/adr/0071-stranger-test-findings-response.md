# 0071 Stranger-Test Findings And Response

## Status

Accepted

## Context

The stranger test must confirm whether a fresh user can complete the workflow without prior context.

## Decision

Run the test in a fresh browser context with a real fixture file. Fix the top three issues before release: unclear file entry, missing state backup/import, and unclear printed packet path.

## Consequences

The final release is judged by a fresh-user workflow, not only unit tests.

## Alternatives Considered

- Skip stranger test due autonomy: rejected by the Phase 3 prompt.
