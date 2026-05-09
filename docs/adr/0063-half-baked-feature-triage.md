# 0063 Half-Baked Feature Triage

## Status

Accepted

## Context

Controls that work partially are worse than missing controls when they imply certainty.

## Decision

Keep and finish packet HTML export by renaming it to user outcome language. Keep voice note and local LLM actions as explicit advanced actions with errors. Finish reset by adding state export/import and settings reset. Finish provenance by including state files and packet metadata.

## Consequences

No production control remains a stub. Optional advanced modules stay gated behind user action.

## Alternatives Considered

- Delete LLM/Whisper/Pandoc actions: rejected because they are wired and useful when supported.
- Hide all advanced actions: rejected because the labels and fallbacks can make them honest enough.
