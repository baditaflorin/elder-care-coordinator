# 0049 Inspectability And Debug Surface

## Status

Accepted

## Context

Users need trust, and maintainers need support data without private telemetry.

## Decision

`?debug=1` exposes source hash, detected shape, candidate explanations, warnings, and timing. Debug stays local and is never transmitted to project-owned infrastructure.

## Consequences

Power users can inspect decisions while normal users see domain-level confidence and warnings.

## Alternatives Considered

Remote logging was rejected by the privacy posture.
