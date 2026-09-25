# BMW iX0 Quality Intelligence — Case Study Guide

## 1. What the application is solving

The source case asks for a frontend quality-monitoring application for a plant quality engineer. The supplied extract covers 2026-01-01 to 2026-06-30, contains one row per reported defect, and does not contain complete production counts. Several defect rows can belong to the same VIN, while a vehicle with no reported defect is absent from the extract.

The application therefore keeps two units separate throughout the analysis:

- **Defect record** = one reported-defect row.
- **Vehicle** = one unique VIN.

This distinction is essential. The current extract contains **8,198 defect records and 7,614 unique VINs**.

### Why 8,198 is not 7,614 + 532×2 + 26×3

The 7,614 figure already counts every unique VIN once. To calculate records from the VIN distribution, use the complete mutually exclusive groups:

- 7,056 VINs × 1 report = 7,056 records
- 532 VINs × 2 reports = 1,064 records
- 26 VINs × 3 reports = 78 records

Therefore:

`7,056 + 1,064 + 78 = 8,198 defect records`

Equivalently, starting from one record per VIN:

`7,614 + 532 additional reports + 52 additional reports = 8,198`

The dashboard uses **8,198** whenever it counts defect reports and **7,614** whenever it counts affected vehicles.

---

# 2. Dashboard navigation

The final navigation deliberately follows the problem-solving order:

1. **Overview** — Task 1 results
2. **Data Explorer** — Task 1 source-record inspection
3. **Outlier Detection** — Task 2
4. **Quality Workflow** — Task 3 and the embedded Task 5 AI step
5. **Vehicle Watchlist** — Task 4

There is no standalone Methodology tab. Explanations are placed next to the analysis they explain so an engineer does not have to leave the workflow to understand a result.

Task 6 is intentionally not implemented because the submission instructions explicitly state that not every task is expected to be finished and ask the candidate to explain prioritisation.

---

# 3. Task 1 — Data Ingestion & Display

## What it does

Task 1 makes the raw defect extract transparent. The Overview shows the main quality KPIs and interactive charts. Data Explorer exposes the underlying records used by those calculations.

The source case requires a dynamic searchable/sortable table, graphical analysis, overall defect-rate analysis with a stated denominator, top-five defects, at least three additional visualizations, and documented cleaning/assumptions.

## Main KPI calculations

### Total defect reports

`8,198`

This is a row count. It does not mean 8,198 vehicles were defective.

### Affected vehicles

`7,614`

This is `COUNT(DISTINCT VIN)`.

### Estimated production denominator

The case supplies approximately 300 vehicles/day for 181 days:

`181 × 300 = 54,300 estimated vehicles`

This is an assumption supplied by the case, not an observed production-count field in the extract.

### Estimated vehicle defect rate

`7,614 ÷ 54,300 × 100 = 14.0%`

Interpretation: approximately 14.0% of the estimated production denominator appears as a VIN in the defect extract. It is not a fully observed production-quality rate because the extract does not contain zero-defect vehicles or actual production counts.

### Defect reports per 100 estimated vehicles

`8,198 ÷ 54,300 × 100 = 15.1`

This means approximately 15.1 **reported defect rows per 100 estimated produced vehicles**. It is not a statement that 15.1% of vehicles were defective.

### Reports per affected vehicle

`8,198 ÷ 7,614 = 1.08`

This uses only vehicles that appear in the defect extract.

### Other supplied KPIs

- Open defects: **499**
- Average recorded resolution time: **8.4 hours**
- Average supplied severity rating: **5.7**
- Severity interpretation: **1 = most severe; 10 = least severe**

## Configuration analysis

The dashboard compares model, motor type and design package using defect-report counts and related affected-VIN context.

It does **not** claim configuration-specific defect incidence rates because production volumes by configuration were not supplied. A rate requires a denominator.

## Top defects

The dashboard counts **reported defect rows** before ranking defect names. The current five most frequent names are:

1. Sensor Failure — 673 reports
2. Paint Scratch — 559 reports
3. Connector Corrosion — 546 reports
4. Water Ingress — 527 reports
5. Loose Wiring — 516 reports

These are frequency results, not causal conclusions.

## Data cleaning and quality treatment

- Station names were normalized using Station ID as the canonical reference.
- The original station-name field is retained for auditability.
- 50 potential duplicate candidates were marked and retained.
- A potential duplicate is not automatically deleted because the available fields cannot prove that two rows describe the same physical defect.
- Resolution-related blanks are interpreted according to the case instructions: an unresolved defect may have blank resolution fields. They are not automatically treated as bad data.
- No record was excluded merely because it looked repetitive.

The Data Explorer is the source-record inspection point for these decisions.

---

# 4. Task 2 — Dynamic Outlier Detection

## Goal

Task 2 identifies unusual observations using thresholds derived from the data rather than fixed production cutoffs.

The implementation covers both families requested by the case:

- **Counts/rates**: daily volume, station volume, defects per VIN
- **Durations**: resolution time and rework time

## Detector 1 — Daily defect volume

**Method:** rolling median + MAD

For each day after a 28-day history is available:

1. Calculate the median daily count in the previous 28 days.
2. Calculate MAD around that median.
3. Convert the current difference into a robust score:

`0.6745 × (current − rolling median) ÷ MAD`

4. Flag when the absolute score is greater than 2.5.

Why: daily volume changes over time, so a local baseline is more appropriate than one fixed threshold. Median and MAD are robust to unusual observations.

## Detector 2 — Station defect volume

**Method:** IQR

1. Count defect reports for each station.
2. Calculate Q1 and Q3 across station totals.
3. Calculate:

`Upper fence = Q3 + 1.5 × IQR`

4. Flag stations above the upper fence.

Current result: **ST-07 has 916 reports**, above the current adaptive upper fence of **761**.

This identifies unusual report volume. It does not prove that the station caused the defects.

## Detector 3 — Defects per VIN

**Method:** adaptive 99th percentile

The distribution is sparse: most VINs have one reported defect. The detector calculates the 99th percentile of defects per VIN and flags VINs above it.

Current result: the 99th percentile is **2**, so VINs with **3 reported defects** are flagged. There are **26** such VINs.

## Detector 4 — Resolution time

**Method:** log1p transformation + IQR

Resolution time is strongly right-skewed. The detector first transforms each recorded duration using `log1p`, calculates IQR bounds on that transformed distribution, then converts the upper threshold back to hours.

Why: a few very long cases should not dominate the original-scale threshold.

## Detector 5 — Rework time

**Method:** IQR on minutes

Rework time is less skewed in this extract, so the original minutes are used directly with the IQR upper fence.

## How to explain a flag

The Outlier Detection UI reports:

- evaluated population
- flagged count
- flagged share
- adaptive threshold/method
- example flagged results
- plain-language explanation

An outlier is an **investigation signal**, not a confirmed defect cause.

---

# 5. Task 3 — Interactive Quality Workflow

## Workflow

`Task 2 signal or manual defect selection → Flag & Save → observation → tracking status → owner → investigation`

The engineer can manually flag a defect even if Task 2 did not flag it. This is explicitly allowed by the case.

## Resolution Status vs Tracking Status

The source already has Resolution Status:

- Open
- In Progress
- Resolved

The application keeps a separate Tracking Status:

- New
- Investigating
- Action Required
- Closed

Reason: these fields answer different questions.

- **Resolution Status:** Is the production defect resolved?
- **Tracking Status:** What is the engineer doing about the investigation?

One defect can therefore be `Resolved` in the source while still being `Closed` or otherwise tracked in the engineering workflow.

## Persistence

The case-study prototype stores tracking records in browser `localStorage`. This keeps the demo persistent across refreshes on the same origin without pretending that a production backend exists.

A production implementation would use authenticated shared persistence.

## Chart interaction

Charts are treated as analysis surfaces. Selecting an aggregate chart signal does not silently create a tracking record for every row in the bucket. The engineer reviews the underlying records and selects the individual defect that actually needs tracking.

---

# 6. Task 4 — Vehicle Quality Watchlist

## Why it exists

Task 2 evaluates separate metric families. A vehicle can have several moderate defects without any single record being a Task 2 outlier.

Task 4 therefore groups existing rows by VIN and shows VINs with **2+ reported defects**.

Current population:

- 7,614 unique VINs total
- 7,056 VINs with exactly 1 report
- 532 VINs with exactly 2 reports
- 26 VINs with exactly 3 reports
- 558 VINs with 2+ reports

The watchlist is a prioritization/review aid, not a vehicle-quality verdict.

## Evidence shown

- defect count
- average severity
- most severe supplied rating
- open defects
- in-progress defects
- Task 2 detector-linked defects
- stations involved
- potential duplicate evidence

The severity burden used for sorting is:

`SUM(11 − Severity Rating)`

because lower severity ratings are more severe in the source scale. It is a transparent sorting measure, not an AI risk score.

## Duplicate handling

Potential duplicates are retained. The application does not automatically delete them because the extract does not prove whether repeated matching fields represent duplicate reporting or a genuine recurrence.

A close-time candidate signal is also shown for records with the same VIN, part and defect name reported within 30 minutes. This is evidence for review, not proof of duplication.

---

# 7. Task 5 — Embed Gen AI

## Specific AI job

The application does not provide a chatbot.

The single AI job is:

> **Given an engineer-flagged defect and a deterministic evidence set, produce a short investigation brief that helps the engineer identify possible root-cause topics and decide what to check next.**

## Where it lives

Task 5 is embedded inside the Task 3 investigation drawer.

The engineer first flags an individual defect. Then the AI section becomes available.

This makes the workflow:

`Flagged defect → deterministic evidence → LLM investigation brief → engineer verification`

## What the application sends to the LLM

The application selects evidence before calling Gemini. It does not send the whole 8,198-row dataset.

Evidence includes:

1. The selected Task 3 defect.
2. Same-VIN context.
3. Related records sharing the same station + defect category within ±14 days, or the same part number + defect name.
4. At most 24 supporting rows.
5. The filters and counts used to create the evidence packet.

Therefore the model does not decide which rows are relevant.

## What Gemini returns

The response is structured into:

- Observed patterns
- Possible investigation topics
- Recommended next checks

Each item must cite exact defect IDs from the supplied evidence.

The AI is not allowed to declare a confirmed root cause, change a source value, change tracking status, reject a vehicle, or create a production decision.

## Evidence verification

There are two protections:

1. **Server-side citation sanitation:** every returned evidence ID is checked against the IDs actually supplied to the model. Unsupported IDs are removed.
2. **UI verification:** the dashboard independently checks that every displayed AI finding has at least one citation that exists in the displayed evidence rows.

The UI explicitly explains the limit of this check:

> It verifies the source references, not causation.

The engineer can therefore inspect the cited rows, filters and values and disagree with the interpretation.

## Confidently-wrong model response

If Gemini suggests an incorrect investigation topic, the damage is limited because the output is only a review aid. The model cannot change production data or automatically trigger a production action.

The correct engineering response is to inspect the cited rows and reject the hypothesis if the evidence does not support it.

---

# 8. What was deliberately not built

## Predictive quality model

Not built because this extract does not provide sufficient complete production outcomes, configuration-level production counts, or validated labels for a defensible predictive model.

## Automatic duplicate deletion

Not built because the available fields cannot prove that repeated records describe the same physical defect.

## Production multi-user backend

Not built because this is a frontend case-study prototype. Tracking therefore uses local browser persistence.

## Task 6 — Causal Inference

Not implemented due to the available development time. The case explicitly says candidates are not expected to finish every task and asks them to explain prioritisation.

The completed scope prioritizes the end-to-end workflow of Tasks 1–5: transparent data, adaptive anomaly detection, engineer tracking, vehicle-level review, and grounded AI-assisted investigation.

---

# 9. What would be needed for production

The main production improvements are:

- actual daily production counts rather than an assumed 300/day denominator
- configuration-level production denominators
- authenticated multi-user tracking storage
- historical monitoring of detector performance
- formal duplicate-review workflow
- validated production outcomes before predictive modeling
- server-side secret management, access control and API rate limiting

These are improvements beyond what the supplied extract can support today.
