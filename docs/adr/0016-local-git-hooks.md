# 0016 Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions and relies on local checks.

## Decision

Use plain `.githooks/` wired by `make install-hooks`. Hooks are idempotent and call Makefile targets:

- pre-commit: format check, lint, typecheck/build prerequisites where fast, and gitleaks when installed.
- commit-msg: Conventional Commits validator.
- pre-push: `make test`, `make build`, and `make smoke`.

## Consequences

Contributors must install hooks locally. The README documents setup.

## Alternatives Considered

- lefthook: viable, but plain hooks avoid another runtime dependency.
