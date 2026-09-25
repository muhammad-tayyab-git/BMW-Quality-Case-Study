# BMW Quality Intelligence — iX0 Production Quality Analytics

React + TypeScript + Vite dashboard for the BMW iX0 production-quality case study.

## Final scope

The final application implements **Tasks 1–5**. Task 6 is intentionally not implemented because the case instructions explicitly allow task prioritisation when time is limited.

The dashboard navigation follows the problem-solving order:

1. **Overview** — Task 1 results
2. **Data Explorer** — Task 1 source-record inspection
3. **Outlier Detection** — Task 2
4. **Quality Workflow** — Task 3 + embedded Task 5 AI investigation
5. **Vehicle Watchlist** — Task 4

There is no standalone Methodology tab. Explanations are placed next to the workflow they describe.

## Run locally

```bash
npm install
npm run dev
```

For Task 5, configure `.env` and start the local AI server in a second terminal:

```bash
cp .env.example .env
npm run ai
```

See **SETUP.md** for the complete setup and troubleshooting sequence.

## Task 1 — Data Ingestion & Display

- Dynamic searchable and sortable defect-record table
- Key filters and complete record detail
- Overall quality KPIs
- Explicit denominator formulas
- Correct separation of defect records and unique VINs
- Model, motor and design-package report analysis without unsupported configuration incidence rates
- Top 5 defect names by reported defect rows
- Category, severity, trend and station visualizations
- Data-quality treatment shown at the point of use
- Source-record inspection through Data Explorer

The extract contains **8,198 defect records and 7,614 unique VINs**. The case supplies approximately 300 vehicles/day for 181 days, so the overall denominator is **54,300 estimated vehicles**. The dashboard explicitly states that 15.1 means defect reports per 100 estimated vehicles, not the percentage of vehicles that were defective.

## Task 2 — Dynamic Outlier Detection

Five adaptive detectors are implemented:

- Daily defect volume — rolling median + MAD
- Station defect volume — IQR upper fence
- Defects per VIN — adaptive 99th percentile
- Resolution time — log1p transformation + IQR
- Rework time — IQR upper fence

The UI reports the evaluated population, flagged count/share, method, threshold and plain-language explanation. Source comments document the statistical rationale, assumptions, tradeoffs and alternatives.

## Task 3 — Interactive Quality Workflow

- Flag Task 2 signals or any individual defect manually
- Add an investigation note
- Assign tracking status and owner
- Search, filter and sort the tracking queue
- Keep Tracking Status separate from source Resolution Status
- Inspect individual source records before taking action
- Persist prototype tracking state in browser localStorage
- Prevent aggregate chart interactions from silently flagging every record in a bucket

## Task 4 — Reflection & Innovation

The Vehicle Quality Watchlist groups retained records by VIN and shows vehicles with **2+ reported defects**. It currently contains **558 VINs**: 532 with exactly two reports and 26 with exactly three reports.

The watchlist is a review aid, not a vehicle-quality verdict. It exposes repeated-report context, severity, unresolved defects, detector-linked records, station involvement and duplicate-candidate evidence.

The required 200–300 word reflection is included in the feature and documented in `TASK4.md`.

## Task 5 — Embed Gen AI

The AI feature is embedded in the **Task 3 Quality Workflow**, not limited to the 558 Task 4 watchlist VINs.

Workflow:

```text
Engineer flags individual defect
        ↓
Application selects deterministic supporting evidence
        ↓
Gemini receives the bounded evidence packet
        ↓
Short investigation brief
        ↓
Engineer checks cited rows and filters
```

The LLM performs one specific job: it produces short observed patterns, possible investigation topics and recommended next checks. It does not select additional records, replace Task 2 analytics, modify production data, change tracking state or declare a confirmed root cause.

Every finding must cite defect IDs supplied in the evidence packet. The server removes unsupported citation IDs, and the UI independently verifies that displayed citations exist in the supplied evidence rows. This verifies the source-reference layer; the engineer remains responsible for judging the interpretation and any causal hypothesis.

## Data preparation

- Station names normalized using Station ID; original station name retained.
- 50 potential duplicate candidates retained and marked rather than deleted.
- Close-time duplicate evidence is treated as a candidate signal, not proof.
- Resolution blanks are interpreted according to the case instructions as unresolved where applicable.
- No record is deleted merely because it appears repetitive.

## Documentation

- `SETUP.md` — complete local setup and Task 5 configuration
- `CASE_STUDY_GUIDE.md` — detailed explanation of the final implementation, calculations, statistical methods, workflow decisions and AI safeguards
- `CUSTOMER_NOTE.md` — one-page customer-facing summary with findings, limitations and next steps
- `TASK1.md`, `TASK2.md`, `TASK3.md`, `TASK4.md`, `TASK5.md` — task-specific notes

## Build

```bash
npm run build
```

A successful build must complete TypeScript checking and the Vite production build without errors.
