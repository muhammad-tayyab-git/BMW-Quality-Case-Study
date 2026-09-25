# Customer Note — BMW iX0 Production Quality

## Scope

The dashboard analyzes the supplied defect extract for 2026-01-01 to 2026-06-30. The extract contains **8,198 reported defect records across 7,614 unique VINs**. Because it contains defects rather than complete production records, vehicle and production rates are presented with their denominator limitations.

## What the dashboard shows

The overall dashboard separates defect-report volume from affected-vehicle counts. Using the case assumption of approximately 300 vehicles/day for 181 days gives an estimated production denominator of 54,300. This produces an estimated 14.0% affected-VIN rate and 15.1 defect reports per 100 estimated vehicles. These are denominator-dependent measures, not observed production rates.

The five most frequent reported defect names are Sensor Failure (673), Paint Scratch (559), Connector Corrosion (546), Water Ingress (527), and Loose Wiring (516). The most frequently reported station is Door Panel Fitting with 916 reports. These are descriptive report-volume findings, not causal conclusions.

## Quality workflow

Task 2 applies adaptive outlier methods to daily volume, station volume, VIN recurrence, resolution time and rework time. Task 3 lets an engineer flag any individual defect, record an observation, assign tracking status and owner, and review the evidence behind the signal. Task 4 adds a vehicle-level watchlist for the 558 VINs with 2+ reported defects without labeling those vehicles defective.

## AI-assisted investigation

Task 5 adds a focused AI investigation brief after an engineer flags an individual defect. The application deterministically selects a bounded evidence set from the full defect extract. The LLM only interprets that evidence and suggests short investigation topics and next checks. Each finding cites source defect IDs, and the engineer can inspect the source rows and filters. The model cannot modify production data or declare a confirmed root cause.

## Main limitations

The least certain assumption is the case-supplied approximately 300 vehicles/day denominator. Actual production counts for the same period, ideally by day and configuration, are needed before defending denominator-based rates to a plant manager. Potential duplicate records are retained because the extract does not provide enough information to prove that repeated reports describe the same physical defect.

## Priority and next step

The completed scope prioritizes a traceable workflow from raw data to anomaly detection, engineer tracking, vehicle-level review and AI-assisted investigation. The next production step would be to connect actual production denominators and authenticated shared tracking data. Task 6 causal inference was not implemented within the available development time; the case instructions explicitly allow prioritisation of tasks.
