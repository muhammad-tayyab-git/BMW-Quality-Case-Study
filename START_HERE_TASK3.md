# Task 3 — Test checklist

## 1. Manual flag

Open **Data Explorer** → choose any defect that Task 2 did not flag → click **Flag**.

Expected:
- it appears in **Quality Workflow**;
- source is **Engineer flag**;
- status starts as **New**;
- owner and note can be edited.

## 2. Chart investigation

Open **Outlier Detection** and click a daily, station, VIN, resolution-time, or rework-time chart element.

Expected:
- a side drawer opens;
- the drawer explains the chart context;
- individual underlying defects are listed;
- clicking the chart does **not** flag the whole group;
- selecting **Flag** on one record creates one individual tracking item.

## 3. Resolution-time example

Click a duration bucket such as **30–40 hours**.

Expected:
- the drawer says how many records are represented;
- the records are listed individually;
- records above the adaptive threshold are identified as detector-flagged;
- the engineer can flag one specific record rather than all records in the bucket.

## 4. Duplicate prevention

Flag the same defect manually, then encounter it through the detector/chart workflow.

Expected:
- one tracking record remains;
- its source becomes **Detector + engineer**;
- notes/status/owner are preserved.

## 5. Tracking workflow

In **Quality Workflow**:

- change Tracking Status;
- edit Owner;
- type an inline comment;
- open the investigation drawer;
- remove a flag.

Expected: the dashboard updates immediately.

## 6. Persistence

Flag a defect, add a note/status, refresh the browser, then return to **Quality Workflow**.

Expected: the tracking item remains.

## 7. Important distinction

`Resolution Status` describes the source production record. `Tracking Status` describes the quality engineer's investigation workflow. They are intentionally separate.


### Comment-first test
1. Open Data Explorer.
2. Find a defect you judge important.
3. Type an observation in the Engineer observation column.
4. Select a tracking status.
5. Click **Flag & Save**.
6. Open Quality Workflow and confirm the same observation and status are present.
7. In Outlier Detection, click a chart element, select an underlying defect, enter an observation, choose a status, and click **Flag & Save**.
