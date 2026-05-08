# 0015 Deployment Topology

## Status

Accepted

## Context

Mode A deploys only static files.

## Decision

GitHub Pages serves the app from `https://baditaflorin.github.io/elder-care-coordinator/`. There is no server, Docker Compose stack, nginx config, Prometheus, or deployment directory.

## Consequences

Operations are limited to building, committing, and pushing `docs/`. Rollback is a git revert.

## Alternatives Considered

- Pages frontend plus Docker backend: rejected by ADR 0001.
