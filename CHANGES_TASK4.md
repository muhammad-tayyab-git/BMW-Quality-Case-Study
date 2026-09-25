# Task 4 Changes — Vehicle Quality Watchlist

## Added

- New **Vehicle Watchlist** dashboard tab.
- Vehicle-level aggregation by VIN using retained defect records.
- Watchlist scope of 2+ reported defects per VIN.
- Severity-aware prioritisation with explicit handling of the case definition that 1 is most severe.
- Transparent severity burden: sum of `11 - Severity Rating`.
- Evidence columns for defect count, average severity, most severe rating, Open/In Progress counts, detector-linked defects, stations involved and duplicate candidates.
- Search, minimum-report filter, sorting and pagination.
- Vehicle review drawer showing the underlying defect records.
- Duplicate candidate evidence is displayed rather than silently removing records.
- Close-time duplicate evidence is shown as a stronger candidate signal, not a confirmed duplicate.
- Individual defects can be selected from the watchlist and sent into the existing Task 3 tracking model with observation, owner and tracking status.
- Task 4 reflection and innovation section in the application.
- `TASK4.md` documentation containing the feature rationale, duplicate handling, reflection and production improvements.

## Deliberately not added

- Predictive vehicle-quality model.
- Automatic vehicle classification or rejection.
- Automatic duplicate deletion/collapsing.
- Separate Task 4 tracking database or tracking entity.
- Backend or multi-user infrastructure.

These were excluded because the supplied defect-only extract does not provide the production-level labels, denominators or deployment requirements needed to justify them.
