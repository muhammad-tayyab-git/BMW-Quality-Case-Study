# Task 3 implementation changes

## Implemented requirements

- Flag individual defects from Data Explorer, including defects not detected by Task 2.
- Track individual detector outliers for resolution/rework duration.
- Click aggregate charts to open an investigation drawer showing the underlying defect records.
- Prevent aggregate chart clicks from automatically flagging all represented records.
- Add search within chart-selected records so engineers can find a specific defect/VIN/station.
- Use the same tracking workflow after selecting a record from a chart.
- Add separate Tracking Status and Owner fields.
- Add inline comments in the Quality Workflow table.
- Add an investigation side drawer for detailed notes and evidence.
- Persist tracking state in browser localStorage.
- Merge repeat flags for the same defect instead of creating duplicate tracking records.

## Deliberately not added

- No permanent chart-signal tracking entity.
- No import/export feature.
- No backend/database/authentication system.
- No multi-user audit system.

These are outside the explicit Task 3 requirements and would make the case-study solution harder to defend without improving the required workflow.


### Inspection-time comments
- Added an Engineer observation field directly to Data Explorer rows.
- Added Tracking status selection before flagging.
- Added **Flag & Save** so the first observation and flag are persisted together.
- Added the same observation/status workflow to chart investigation records.
- Kept chart elements as navigation/analysis surfaces; only individual defects become tracking records.
