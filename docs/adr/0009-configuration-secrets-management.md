# 0009 Configuration And Secrets Management

## Status

Accepted

## Context

The frontend must never contain project-owned secrets.

## Decision

No secrets are required in v1. Public build configuration is limited to Pages base path and build metadata. `.env*` is gitignored except `.env.example`. Hooks run gitleaks when the binary is installed.

## Consequences

Users can run the app without provisioning credentials. Any future API key flow must be BYO-key or move the secret into a non-frontend offline process.

## Alternatives Considered

- Store encrypted secrets in the repo: rejected.
- Use a hosted secret proxy: rejected by ADR 0001.
