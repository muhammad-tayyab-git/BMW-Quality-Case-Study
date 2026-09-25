# Task 3 — Interactive Quality Workflow

## Design decision

Task 3 turns an automated or engineer-selected defect into an actionable quality-workflow record. The workflow tracks **individual defect records**, not chart aggregates.

A chart is an analytical view. A bar, point, or bucket can represent many defects, so clicking it opens a contextual review drawer. The drawer shows the underlying records and lets the engineer flag the individual defect that deserves follow-up. This avoids accidentally treating an aggregate chart bucket as one defect or flagging every record represented by it.

## Flagging sources

- **Task 2 detector:** an individual defect directly identified by the duration outlier detector can be tracked from the detector table/detail view.
- **Chart investigation:** clicking a daily, station, VIN, resolution-time, or rework-time chart element opens its underlying records. Selecting a record creates an individual tracking item. For duration charts, records above the adaptive threshold retain detector provenance; other selections are manual engineer flags.
- **Manual engineer flag:** Data Explorer allows an engineer to flag any defect even when Task 2 did not identify it.
- If the same defect is subsequently identified through another route, the existing tracking item is reused and its source becomes `Detector + engineer` rather than creating a duplicate investigation.

## Comments on charts

Comments are not embedded directly in the chart. The chart remains focused on visual analysis. A contextual side drawer explains what was selected, how many records it represents, the relevant detector threshold, and lists the underlying defects. Once an individual defect is selected, the normal tracking workflow provides the note, owner, and tracking status. This keeps comments traceable to a specific defect and avoids ambiguity about whether a note refers to a chart bucket or every record inside it.

## Tracking status vs Resolution Status

The source `Resolution Status` remains unchanged and describes production resolution: Open, In Progress, or Resolved.

Task 3 uses a separate `Tracking Status`:

- New
- Investigating
- Action Required
- Closed

This separation is intentional. A defect can be production-resolved while a quality engineer is still investigating recurrence or corrective action. Conversely, an open production defect may not yet require a separate quality investigation.

## Tracking dashboard

The Quality Workflow tab provides:

- flagged-defect count and status counts;
- search across defect/signal, VIN, station, owner and notes;
- status and source filters;
- newest/oldest sorting;
- inline comments and owner editing;
- an investigation drawer with evidence and record context;
- flag removal.

## Persistence

Tracking records are stored in browser `localStorage` so a case-study demonstration survives a page refresh. This is a prototype persistence choice, not a case-study requirement. A production implementation would move the same tracking model to an authenticated backend/database for shared multi-user persistence and auditability.

No import/export workflow or separate permanent chart-signal entity is used because neither is required by Task 3 and both would add unnecessary scope.


## Inspection-time annotation decision

Task 3 uses an inspection-first workflow. In Data Explorer, an engineer can type an observation directly in the row, choose the tracking status, and use **Flag & Save** so the observation and flag are persisted together. This avoids forcing the engineer to remember what they noticed after navigating to another screen.

For charts, comments are handled in a contextual side drawer rather than inside the chart. A chart element may represent many defect records, so an inline chart comment would be ambiguous. Clicking a chart element opens the underlying records; the engineer selects the individual defect, enters the observation and tracking status, and uses **Flag & Save**. The chart itself is never stored as a separate tracking entity.
