# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

Care data should survive refreshes and offline use without leaving the browser.

## Decision

Use IndexedDB via `idb` for durable document storage. Store a Yjs binary update as the canonical local collaboration state, plus a validated JSON snapshot for migration and recovery. Use localStorage only for non-sensitive UI preferences.

## Consequences

Data remains local and can be backed up by encrypted export. Browser clearing actions can remove data, so the UI must make backup/export visible.

## Alternatives Considered

- localStorage for all data: rejected due size, durability, and sensitivity.
- Server database: rejected by ADR 0001.
