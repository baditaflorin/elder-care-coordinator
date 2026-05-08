# 0008 Go Backend Project Layout

## Status

Accepted

## Context

This ADR is mandatory for Modes B and C. ADR 0001 selects Mode A.

## Decision

No Go backend or Go data generator is created in v1. Backend layout directories such as `cmd/`, `internal/`, and `api/` are omitted.

## Consequences

There is no Docker image, server binary, or Go toolchain requirement. If Mode B or C is adopted later, this ADR must be replaced before adding Go code.

## Alternatives Considered

- Scaffold unused Go directories: rejected because empty backend scaffolding creates maintenance noise.
