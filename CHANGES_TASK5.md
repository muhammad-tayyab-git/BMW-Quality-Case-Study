# Task 5 Final Changes

## Workflow correction

- AI is embedded in the Task 3 Quality Workflow.
- Task 5 starts from an individual engineer-flagged defect.
- Supporting evidence is selected from the full 8,198-record dataset.
- Task 5 is not restricted to the 558 Task 4 watchlist VINs.

## Evidence and verification

- Deterministic evidence rules are documented in `src/utils/aiInvestigation.ts`.
- Supporting evidence is capped at 24 rows.
- Gemini is instructed to cite only supplied defect IDs.
- Server-side sanitation removes unsupported citation IDs.
- Client-side verification confirms that every displayed finding has valid evidence references.
- The UI explicitly distinguishes source-reference verification from proof of causation.

## Dashboard finalization

- Removed the standalone Methodology tab.
- Removed the generic Actionable quality insights dashboard section.
- Added concise task headers and point-of-use explanations.
- Reordered tabs to Overview → Data Explorer → Outlier Detection → Quality Workflow → Vehicle Watchlist.
- Added a compact Task 1 Data Basis panel covering data grain, VIN counting and cleaning/duplicate treatment.
- Added `SETUP.md`, `CASE_STUDY_GUIDE.md` and `CUSTOMER_NOTE.md`.

## Code documentation

- Added explanatory inline comments to the statistical detectors, Task 1 aggregations, Task 3 persistence/reconciliation, Task 4 watchlist logic and Task 5 evidence/AI server logic.
- Comments explain rationale, assumptions, tradeoffs and boundaries rather than merely restating code.

## Deliberately excluded

- No chatbot.
- No predictive quality score.
- No automatic root-cause decision.
- No automatic duplicate deletion.
- No Task 6 implementation.
