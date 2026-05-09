# 0062 Output Pathway Coverage Policy

## Status

Accepted

## Context

Phase 2 outputs packets and drafts, but users also need to back up, restore, copy, print, and move their workspace.

## Decision

Add versioned full-state JSON export/import, copy-to-clipboard for draft and packet, packet print, and small hash links for intake text. Keep CSV/API/embed out of scope because they are not claimed product paths.

## Consequences

Users can finish an end-to-end workflow and move work across browsers without a server.

## Alternatives Considered

- Share full care state in URL hash: rejected because URLs become too large and expose sensitive data.
- API output: rejected by Mode A.
