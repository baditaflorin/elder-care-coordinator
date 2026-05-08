# 0007 Data Generation Pipeline

## Status

Accepted

## Context

This ADR is mandatory for Mode B, but ADR 0001 selects Mode A.

## Decision

No data generation pipeline exists in v1. `make data` is intentionally absent because there are no scheduled inputs or generated public artifacts.

## Consequences

The repository remains static and simple. If shared public medication reference data is added later, this ADR must be superseded.

## Alternatives Considered

- Add an empty generator: rejected because it would imply an operational responsibility that does not exist.
