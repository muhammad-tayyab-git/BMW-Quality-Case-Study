# Task 1 — Data Ingestion & Display

## Objective

Make the provided defect extract transparent and help a plant quality engineer understand the current state of defects.

## Implemented frontend requirements

### 1. Dynamic table
The Data Explorer supports:
- full-text search across source fields
- model, motor, design, resolution-status and category filters
- column sorting
- pagination
- record-detail inspection
- all supplied source fields in the record-detail view

### 2. Graphical analysis
The Overview provides interactive charts for:
- car model
- motor type
- design package
- top 5 defect types
- defect category
- severity distribution
- monthly report trend
- station report volume
- station average resolution time

Severity ratings 1–3 are visually highlighted because the case defines 1 as the most severe rating.

### 3. Overall rates and denominator
The case provides approximately 300 units/day for 181 days, giving an estimated production denominator of 54,300 vehicles.

The dashboard reports:
- defect reports / 100 estimated produced vehicles
- affected-vehicle rate
- reports / affected vehicle

The dashboard explicitly states that 15.1 reports per 100 estimated vehicles is a report frequency, not a claim that 15.1% of vehicles were defective.

### 4. Configuration analysis
Model, motor and design views show:
- defect reports
- share of all defect reports
- affected VINs
- reports per affected vehicle

Production volumes by configuration were not supplied, so unsupported configuration-specific production rates are not presented.

### 5. Top 5 defects
The dashboard defines the counting unit before presenting the ranking:
- one dataset row = one reported defect

For each top defect it provides:
- report count
- report share
- affected VINs
- reports per affected vehicle
- average severity
- number of severity 1–3 reports

### 6. Data preparation
Documented preparation includes:
- station-name normalization using Station ID
- preservation of the original station name
- potential-duplicate flagging rather than automatic deletion
- retention of unresolved resolution fields as null

### 7. Assumptions and limitations
The dashboard documents these at the point of use and the final `CASE_STUDY_GUIDE.md` provides the complete explanation:
- production denominator assumption
- defect-report grain
- VIN interpretation
- severity interpretation
- resolution-field interpretation
- configuration-volume limitation
- duplicate uncertainty

### 8. Point-of-use explanations
The final dashboard keeps the main Overview focused on measured quality results. Data basis, denominator rules, cleaning treatment and assumptions are shown next to the relevant analysis instead of in a separate generic insight section. Detailed findings and limitations are documented in `CASE_STUDY_GUIDE.md`.

## What Task 1 does not claim

The dashboard does not claim causal relationships, production-normalized configuration rates, or that potential duplicate records are definitely duplicate defects. Those conclusions require additional evidence.

Adaptive statistical outlier detection is handled as Task 2 rather than being silently mixed into Task 1.
