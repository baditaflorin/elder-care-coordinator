# Phase 2 Substance Plan

Status: accepted by user request "continue and fully implement this".

## Ranked Substance Items

1. #8 Useful first guess on first input
2. #6 Auto-detect structure
3. #7 Auto-classify fields
4. #9 Format normalization by default
5. #12 Domain-aware validation
6. #16 Confidence scores on every inference
7. #18 Surface anomalies
8. #32 Errors are actionable
9. #35 Deterministic outputs
10. #38 Output provenance
11. #1 Fuzz parser with real fixtures
12. #2 Encoding and format variants
13. #4 Partial inputs
14. #5 Adversarial input
15. #13 Recognize common shapes
16. #14 Domain-aware export
17. #15 Domain conventions baked in
18. #17 Suggest fixes
19. #19 Explain decisions
20. #21 Lossless round-trip
21. #22 Stable IDs everywhere
22. #24 Enumerate reachable states
23. #25 No stuck states
24. #26 Cancellation actually cancels
25. #27 Concurrency safety
26. #31 Cache expensive things
27. #33 Validate at boundaries
28. #36 Inspectable history
29. #37 Debug overlay
30. #39 Remember user corrections within session

## Implementation Boundaries

The existing product surface remains medications, appointments, correspondence, family coordination, and emergency packet export. Phase 2 adds a smarter intake engine inside those domains; it does not add cloud sync, medical advice, diagnosis, insurer submission, or a backend.

## Target Pass Rate

Before: 0/10 real-data inputs produce a useful structured first guess.

After target: at least 7/10 produce useful candidates, confidence, warnings, and deterministic normalized output.
