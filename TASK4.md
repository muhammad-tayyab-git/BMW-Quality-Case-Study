# Task 4 — Reflection & Innovation

## Vehicle Quality Watchlist

### Purpose

Task 2 identifies unusual individual analytical signals. It can miss a vehicle-level pattern where several individually moderate defects occur on the same VIN without any one record being an outlier. Task 4 therefore adds a Vehicle Quality Watchlist that groups the retained defect records by VIN and surfaces vehicles with two or more reported defects for engineering review.

The feature is a review aid, not a vehicle-quality verdict. It exposes defect count, average severity, most severe rating, open/in-progress defects, detector signals, station involvement and duplicate-candidate evidence.

### Severity

The case defines severity 1 as most severe and 10 as least severe. The watchlist therefore treats a lower rating as more severe. A transparent severity burden is calculated as the sum of `11 - Severity Rating` across a vehicle's retained defect records. It is used for sorting/prioritisation only and is not a predictive risk score.

### Duplicate handling

The raw analytical records are retained. Fifty records were identified as potential duplicate candidates using VIN, Production Date, Station ID, Part Number and Defect Name. A smaller subset also has very close report times and is shown as stronger duplicate evidence. These records are not automatically deleted because the available fields cannot prove whether they represent duplicate reporting or genuine recurring defects.

### Integration with Task 3

The watchlist does not create a separate tracking system. The engineer selects a vehicle, reviews its individual defect records, selects the relevant defect and then uses the existing Task 3 tracking model to record an observation, owner and tracking status. The tracking record is stored against the individual defect.

## Reflection

The dashboard is based on a raw defect export rather than complete production records. The data contains reported defects only, several defects can share a VIN, and vehicles with no defects are absent from the extract. Therefore, some conclusions depend on assumptions about the available denominator and cannot be treated as complete production-quality rates.

One limitation of the Task 2 outlier approach is that it evaluates individual analytical signals. A vehicle with several moderate defects may not contain any single record that is an outlier, even though the combination of defects deserves engineering attention. To address this limitation, I implemented a Vehicle Quality Watchlist that groups retained defect records by VIN and highlights vehicles with multiple reports, severity evidence, unresolved defects, detector flags and station involvement.

I did not build a predictive quality model because the extract does not provide sufficient production-level outcomes, complete production counts, or validated labels for predicting future vehicle quality. I also did not automatically remove suspected duplicate records. Fifty candidate records were identified using matching vehicle, production, station, part and defect information, with a smaller subset having close reporting times. These records were retained because the available fields cannot prove that they represent duplicate physical defects.

The assumption I am least confident about is the approximately 300 units-per-day production volume supplied for the case. If this assumption is inaccurate, denominator-based KPIs such as the estimated vehicle defect rate will change, although the underlying defect records do not.

The dashboard number I would not yet defend to a plant manager is the estimated vehicle defect rate. To defend it, I would need actual production counts for the same period, ideally broken down by day and vehicle configuration.

## Production improvements

If deployed beyond the frontend case-study prototype, the next improvements would include actual production denominators, authenticated multi-user persistence, historical monitoring, validated duplicate-review workflows, and production/configuration-level quality outcomes for any future predictive model.
