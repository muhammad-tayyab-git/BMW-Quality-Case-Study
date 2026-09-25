# Task 2 — Dynamic Outlier Detection

## Requirement from the case study

The case asks for an automated way to flag unusual quality points so plant quality engineers know where to focus. The detector must use data-driven thresholds that adapt to future data; fixed production cutoffs are not sufficient. The case specifically encourages assessing both duration metrics and count/rate metrics, reporting how many records/groups are flagged and their share, documenting statistical assumptions and trade-offs, offering adjustable KPIs, and providing plain-language explanations for individual flags.

The user is a plant quality engineer rather than a statistician, so the UI explains each method in operational language and treats a flag as a review signal rather than proof of a process cause.

## Metrics selected

### 1. Daily defect volume

**Method:** rolling median + MAD (median absolute deviation)

**Configuration:** 28-day historical window and robust-score threshold of 2.5 by default. The UI allows the engineer to change the window to 14, 21, 28 or 42 days and the score threshold to 2.0, 2.5, 3.0 or 3.5.

**Why:** daily defect volume can move with changing production conditions. A rolling baseline adapts to those changes. Median and MAD are robust to isolated spikes and are less sensitive to extreme values than a mean/standard-deviation baseline.

**Warm-up:** the first 28 days are not scored when the default window is used because there is no previous 28-day baseline. With the default settings, 153 of the 181 calendar days are evaluated.

**Verified result on the supplied extract:** 9 flagged days out of 153 evaluated days (5.88%): 7 low-volume signals and 2 high-volume signals. The high-volume signals are 2026-03-09 (65 reports) and 2026-03-16 (63 reports).

### 2. Station defect volume

**Method:** IQR upper fence.

**Why:** station report counts form a cross-station distribution. The IQR rule identifies an unusually high upper tail without requiring a normal distribution or a fixed station-specific cutoff.

**Important limitation:** this is station defect-report volume, not a station defect rate. The case extract does not contain production denominators by station.

**Verified result:** 1 of 18 stations flagged (5.56%): ST-07 with 916 reports, above the adaptive upper threshold of 761.

### 3. Defects per VIN

**Method:** adaptive 99th percentile.

**Why:** the VIN distribution is highly discrete. Most affected vehicles have one report, while a small upper tail has more reports. A high percentile defines rarity from the observed distribution instead of imposing a fixed rule such as “three defects is always an outlier.”

**Verified result:** 26 of 7,614 affected VINs flagged (0.34%). The threshold is 2 reports per VIN, so the 26 VINs with 3 reports are flagged.

### 4. Resolution time

**Method:** log1p transformation followed by IQR.

**Why:** resolved resolution times are strongly right-skewed. Applying IQR directly to the raw scale would be overly influenced by the long right tail. log1p reduces that skew before calculating the IQR upper fence; the resulting boundary is transformed back into hours for the engineer.

**Population:** only records with a recorded resolution time are evaluated. Unresolved records are not treated as missing data; the case explicitly states that blank resolution fields mean the defect is not resolved yet.

**Verified result:** 152 of 6,947 resolved records flagged (2.19%), with an adaptive upper threshold of approximately 31.05 hours.

### 5. Rework time

**Method:** IQR upper fence.

**Why:** the supplied rework-time distribution is comparatively well behaved, so a standard IQR upper fence gives an adaptive and interpretable boundary without a fixed minute cutoff.

**Population:** records with recorded rework time, i.e. resolved defects in this extract.

**Verified result:** 20 of 6,947 evaluated records flagged (0.29%), with an upper threshold of 162.75 minutes.

## Verification summary

| Metric | Method | Evaluated | Flagged | Share | Adaptive threshold |
|---|---|---:|---:|---:|---:|
| Daily defect volume | Rolling median + MAD | 153 days | 9 | 5.88% | Robust score 2.5 |
| Station defect volume | IQR | 18 stations | 1 | 5.56% | 761 reports |
| Defects per VIN | 99th percentile | 7,614 VINs | 26 | 0.34% | 2 reports/VIN |
| Resolution time | log1p + IQR | 6,947 records | 152 | 2.19% | 31.05 hours |
| Rework time | IQR | 6,947 records | 20 | 0.29% | 162.75 minutes |

## Why these methods are defensible

The detector deliberately uses different methods for different metric families instead of forcing one rule onto every variable:

- A local robust baseline is appropriate for a time series whose normal level can change over time.
- IQR is appropriate for cross-sectional counts and a comparatively well-behaved duration distribution because it is resistant to extreme observations and does not require normality.
- A high percentile is appropriate for a discrete rarity problem where the main question is which vehicles sit in the extreme upper tail.
- Log1p + IQR is appropriate for the strongly right-skewed resolution-time distribution because the transformation makes the IQR boundary less dominated by very long cases.

## UI/UX decisions

The Outlier Detection tab is designed for a quality engineer:

1. **Metric cards** show the five monitored signals and immediately report flagged count and flagged share.
2. **Metric selector** lets the engineer move between detector families without leaving the workflow.
3. **Adjustable daily controls** expose the baseline window and robust-score threshold rather than hiding them as hard-coded values.
4. **Visual context** shows the underlying distribution/trend and distinguishes flagged observations from ordinary observations.
5. **Flagged-signal table** provides search, pagination, observed value, adaptive threshold and direction.
6. **Info actions** open a plain-language explanation of why a specific signal was flagged and show supporting record context.
7. **Uncertainty statement** explicitly says that an outlier is an investigation signal, not proof of root cause or causality.

## Additional KPIs worth monitoring

The following are natural next KPIs for a production deployment. They are intentionally not silently substituted for the required Task 2 detectors because the supplied extract lacks some necessary denominators.

- **Unresolved backlog rate** — quality engineer; supports decisions about escalation and staffing. Adjustable by status and date window.
- **Severe-defect share (severity 1–3)** — quality engineer and plant manager; supports prioritization of critical quality issues. Adjustable by date, station and model.
- **Repeat-defect VIN share** — quality engineer; supports vehicle-level investigation. Adjustable by minimum defect count and production period.
- **Root-cause identification coverage** — quality engineer; supports process-learning follow-up. Adjustable by resolution status and period.
- **Station defect concentration** — quality engineer; supports station-level review. Should become a rate only when station production denominators are available.

## What the detector does not claim

A flag does not establish:

- that the record is incorrect;
- that a station caused the defect;
- that a defect is statistically significant in a formal hypothesis-test sense;
- that resolution time causes severity; or
- that a flagged VIN has a common root cause.

Those questions require additional process evidence and are intentionally separated from Task 2.
