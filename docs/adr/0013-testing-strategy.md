# 0013 Testing Strategy

## Status

Accepted

## Context

Local hooks replace GitHub Actions, and checks must be fast enough for pre-push.

## Decision

Use Vitest for unit tests, Testing Library for component tests, and Playwright for smoke/e2e. `make test` runs unit tests. `make build` produces `docs/`. `make smoke` serves `docs/` and verifies the built app with Playwright.

## Consequences

The test suite stays local and fast. Browser smoke coverage catches Pages base-path and routing issues.

## Alternatives Considered

- GitHub Actions: explicitly out of scope.
- Manual-only testing: rejected because Pages regressions are easy to miss.
