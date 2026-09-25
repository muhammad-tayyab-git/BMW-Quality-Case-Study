/**
 * Task 2 statistical engine. The case requires adaptive thresholds rather
 * than fixed production cutoffs. The functions below therefore calculate
 * thresholds from the current observed distribution and return the evidence
 * needed by the UI to explain each flag.
 */
import type { Defect } from "../types/defect";
import type { OutlierResult, OutlierSummary } from "../types/outlier";
// Median is used as a robust center because it is less affected by extreme values than the mean.
function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);

  const index = (percentileValue / 100) * (sorted.length - 1);

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;

  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}
// MAD (median absolute deviation) provides a robust spread estimate for daily counts.
// It is paired with the rolling median so one unusual day does not distort its own baseline.
function mad(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const center = median(values);

  const deviations = values.map((value) => Math.abs(value - center));

  return median(deviations);
}
// IQR bounds are recalculated from the supplied group/record population.
// The 1.5×IQR rule is a standard distribution-robust outlier convention and
// avoids choosing a business threshold such as "more than 50 defects".
function iqrBounds(values: number[]): {
  lower: number;
  upper: number;
  q1: number;
  q3: number;
} {
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);

  const iqr = q3 - q1;

  return {
    q1,
    q3,
    lower: q1 - 1.5 * iqr,
    upper: q3 + 1.5 * iqr,
  };
}

interface DailyCount {
  date: string;
  count: number;
}

function getDailyCounts(defects: Defect[]): DailyCount[] {
  const counts = new Map<string, number>();

  for (const defect of defects) {
    counts.set(defect.reportDate, (counts.get(defect.reportDate) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Station volume is a count across the 18 station groups, so IQR is applied
// across station totals rather than to individual defect rows.
export function detectStationOutliers(defects: Defect[]): OutlierSummary {
  const stationCounts = new Map<string, number>();

  for (const defect of defects) {
    const current = stationCounts.get(defect.stationId) ?? 0;

    stationCounts.set(defect.stationId, current + 1);
  }

  const values = Array.from(stationCounts.values());

  const bounds = iqrBounds(values);

  const results: OutlierResult[] = [];

  for (const [stationId, count] of stationCounts) {
    if (count > bounds.upper) {
      results.push({
        id: stationId,
        metric: "station-defects",
        method: "iqr",
        value: count,
        threshold: bounds.upper,
        score: null,
        direction: "high",
        label: `Station ${stationId} has unusually high defect volume`,
        explanation: `This station has ${count} defect reports, which is above the adaptive IQR upper threshold of ${bounds.upper.toFixed(0)} reports.`,
        source: null,
      });
    }
  }

  return {
    metric: "station-defects",
    method: "iqr",
    total: stationCounts.size,
    flagged: results.length,
    share: stationCounts.size === 0 ? 0 : results.length / stationCounts.size,
    threshold: bounds.upper,
    results,
  };
}
// Rework time is already comparatively well behaved, so the original-scale
// IQR threshold is retained and reported in minutes.
export function detectReworkTimeOutliers(defects: Defect[]): OutlierSummary {
  const values = defects
    .map((defect) => defect.reworkTimeMinutes)
    .filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );

  const bounds = iqrBounds(values);

  const results: OutlierResult[] = [];

  for (const defect of defects) {
    const value = defect.reworkTimeMinutes;

    if (value === null || !Number.isFinite(value)) {
      continue;
    }

    if (value > bounds.upper) {
      results.push({
        id: defect.defectId,
        metric: "rework-time",
        method: "iqr",
        value,
        threshold: bounds.upper,
        score: null,
        direction: "high",
        label: "Unusually long rework time",
        explanation: `This defect required ${value.toFixed(0)} minutes of rework, above the adaptive IQR threshold of ${bounds.upper.toFixed(0)} minutes.`,
        source: defect,
      });
    }
  }

  return {
    metric: "rework-time",
    method: "iqr",
    total: values.length,
    flagged: results.length,
    share: values.length === 0 ? 0 : results.length / values.length,
    threshold: bounds.upper,
    results,
  };
}
// Resolution time is strongly right-skewed in this extract. log1p reduces the
// influence of the very long cases before IQR is calculated, then the threshold
// is transformed back to hours for an engineer-readable result.
export function detectResolutionTimeOutliers(
  defects: Defect[],
): OutlierSummary {
  const resolvedDefects = defects.filter(
    (defect) =>
      defect.resolutionTimeHours !== null &&
      Number.isFinite(defect.resolutionTimeHours),
  );

  const transformedValues = resolvedDefects.map((defect) =>
    Math.log1p(defect.resolutionTimeHours as number),
  );

  const bounds = iqrBounds(transformedValues);

  const threshold = Math.expm1(bounds.upper);

  const results: OutlierResult[] = [];

  for (const defect of resolvedDefects) {
    const value = defect.resolutionTimeHours;

    if (value === null || !Number.isFinite(value)) {
      continue;
    }

    const transformedValue = Math.log1p(value);

    if (transformedValue > bounds.upper) {
      results.push({
        id: defect.defectId,
        metric: "resolution-time",
        method: "log-iqr",
        value,
        threshold,
        score: null,
        direction: "high",
        label: "Unusually long resolution time",
        explanation: `This defect took ${value.toFixed(2)} hours to resolve, above the adaptive threshold of ${threshold.toFixed(2)} hours. The detector uses log transformation because resolution times are strongly right-skewed.`,
        source: defect,
      });
    }
  }

  return {
    metric: "resolution-time",
    method: "log-iqr",
    total: resolvedDefects.length,
    flagged: results.length,
    share:
      resolvedDefects.length === 0
        ? 0
        : results.length / resolvedDefects.length,
    threshold,
    results,
  };
}
// VIN recurrence is a sparse count distribution (most VINs have one report).
// An adaptive 99th percentile is therefore more informative than a fixed count.
export function detectVinOutliers(defects: Defect[]): OutlierSummary {
  const vinCounts = new Map<string, number>();

  for (const defect of defects) {
    const current = vinCounts.get(defect.vin) ?? 0;

    vinCounts.set(defect.vin, current + 1);
  }

  const values = Array.from(vinCounts.values());

  const threshold = percentile(values, 99);

  const results: OutlierResult[] = [];

  for (const [vin, count] of vinCounts) {
    if (count > threshold) {
      results.push({
        id: vin,
        metric: "vin-defects",
        method: "percentile",
        value: count,
        threshold,
        score: null,
        direction: "high",
        label: "Rare high-defect VIN",
        explanation: `This vehicle has ${count} reported defects, placing it above the adaptive 99th-percentile threshold of ${threshold.toFixed(0)} defects per VIN.`,
        source: null,
      });
    }
  }

  return {
    metric: "vin-defects",
    method: "percentile",
    total: vinCounts.size,
    flagged: results.length,
    share: vinCounts.size === 0 ? 0 : results.length / vinCounts.size,
    threshold,
    results,
  };
}
// Daily volume changes over the six-month window, so the detector compares each
// day with the preceding 28 days rather than with one global average. The robust
// z-score uses 0.6745 so the score is comparable to a normal-score scale.
export function detectDailyOutliers(
  defects: Defect[],
  windowSize = 28,
  zThreshold = 2.5,
): OutlierSummary {
  const dailyCounts = getDailyCounts(defects);

  const results: OutlierResult[] = [];

  for (let index = windowSize; index < dailyCounts.length; index += 1) {
    const current = dailyCounts[index];

    const previousWindow = dailyCounts
      .slice(index - windowSize, index)
      .map((item) => item.count);

    const center = median(previousWindow);
    const deviation = mad(previousWindow);

    if (deviation === 0) {
      continue;
    }

    const score = (0.6745 * (current.count - center)) / deviation;

    if (Math.abs(score) <= zThreshold) {
      continue;
    }

    const direction = score > 0 ? "high" : "low";

    results.push({
      id: current.date,
      metric: "daily-defects",
      method: "rolling-mad",
      value: current.count,
      threshold:
        center +
        (direction === "high"
          ? (zThreshold * deviation) / 0.6745
          : -(zThreshold * deviation) / 0.6745),
      score,
      direction,
      label:
        direction === "high"
          ? "Unusually high daily defect volume"
          : "Unusually low daily reporting volume",
      explanation:
        direction === "high"
          ? `This day recorded ${current.count} defect reports, which is unusually high compared with the previous ${windowSize} days.`
          : `This day recorded only ${current.count} defect reports, which is unusually low compared with the previous ${windowSize} days.`,
      source: null,
    });
  }

  const evaluatedDays = Math.max(0, dailyCounts.length - windowSize);

  return {
    metric: "daily-defects",
    method: "rolling-mad",
    total: evaluatedDays,
    flagged: results.length,
    share: evaluatedDays === 0 ? 0 : results.length / evaluatedDays,
    threshold: zThreshold,
    results,
  };
}
export function detectAllOutliers(defects: Defect[]): OutlierSummary[] {
  return [
    detectDailyOutliers(defects),
    detectStationOutliers(defects),
    detectVinOutliers(defects),
    detectResolutionTimeOutliers(defects),
    detectReworkTimeOutliers(defects),
  ];
}
