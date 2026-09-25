/**
 * Task 1 aggregation helpers. Each aggregation is deterministic and operates
 * on the same row-level defect records shown in Data Explorer.
 *
 * Statistical note: configuration summaries intentionally report defect burden,
 * not production defect rates, because configuration-level production volumes
 * are not present in the case extract. Vehicle measures use distinct VINs.
 */
import type { Defect } from "../types/defect";

export interface CategoryCount {
  name: string;
  count: number;
}

export interface TopDefect {
  name: string;
  count: number;
  share: number;
  affectedVehicles: number;
  reportsPerAffectedVehicle: number;
  averageSeverity: number | null;
  severeReports: number;
}

export interface MonthlyDefectCount {
  month: string;
  monthLabel: string;
  count: number;
}

export interface DailyDefectCount {
  date: string;
  dateLabel: string;
  count: number;
}

export interface SeverityCount {
  severity: number;
  count: number;
}

export interface StationDefectCount {
  name: string;
  count: number;
}

export interface StationResolutionMetric {
  name: string;
  averageHours: number;
  resolvedReports: number;
}

export interface ConfigurationMetric {
  name: string;
  defectReports: number;
  reportShare: number;
  affectedVehicles: number;
  reportsPerAffectedVehicle: number;
}

/**
 * Generic category counter.
 *
 * One row in the dataset represents one reported defect.
 */
function countBy(
  defects: Defect[],
  getValue: (defect: Defect) => string,
): CategoryCount[] {
  const counts = new Map<string, number>();

  for (const defect of defects) {
    const value = getValue(defect);

    counts.set(
      value,
      (counts.get(value) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getDefectsByCarModel(
  defects: Defect[],
): CategoryCount[] {
  return countBy(
    defects,
    (defect) => defect.carModel,
  );
}

export function getDefectsByMotorType(
  defects: Defect[],
): CategoryCount[] {
  return countBy(
    defects,
    (defect) => defect.motorType,
  );
}

export function getDefectsByDesignPackage(
  defects: Defect[],
): CategoryCount[] {
  return countBy(
    defects,
    (defect) => defect.designPackage,
  );
}

export function getDefectsByCategory(
  defects: Defect[],
): CategoryCount[] {
  return countBy(
    defects,
    (defect) => defect.defectCategory,
  );
}

/**
 * Top defect types.
 *
 * count:
 * Number of defect-report rows.
 *
 * share:
 * Percentage of all defect reports represented by the defect.
 *
 * affectedVehicles:
 * Number of unique VINs associated with the defect.
 *
 * reportsPerAffectedVehicle:
 * Number of reports of this defect divided by affected VINs.
 *
 * averageSeverity:
 * Average supplied severity rating.
 *
 * severeReports:
 * Number of reports with severity 1–3.
 */
export function getTopDefects(
  defects: Defect[],
  limit = 5,
): TopDefect[] {
  const grouped = new Map<
    string,
    {
      count: number;
      vins: Set<string>;
      severityTotal: number;
      severityCount: number;
      severeReports: number;
    }
  >();

  for (const defect of defects) {
    const existing = grouped.get(defect.defectName);

    const isSevere = defect.severityRating >= 1 &&
      defect.severityRating <= 3;

    if (existing) {
      existing.count += 1;
      existing.vins.add(defect.vin);
      existing.severityTotal += defect.severityRating;
      existing.severityCount += 1;

      if (isSevere) {
        existing.severeReports += 1;
      }
    } else {
      grouped.set(defect.defectName, {
        count: 1,
        vins: new Set([defect.vin]),
        severityTotal: defect.severityRating,
        severityCount: 1,
        severeReports: isSevere ? 1 : 0,
      });
    }
  }

  const totalReports = defects.length;

  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,
      count: value.count,

      share:
        totalReports === 0
          ? 0
          : (value.count / totalReports) * 100,

      affectedVehicles: value.vins.size,

      reportsPerAffectedVehicle:
        value.vins.size === 0
          ? 0
          : value.count / value.vins.size,

      averageSeverity:
        value.severityCount === 0
          ? null
          : value.severityTotal / value.severityCount,

      severeReports: value.severeReports,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Monthly defect reports based on Report Date.
 *
 * The dashboard covers Jan-Jun 2026, so the visualization
 * intentionally aggregates daily records into six months.
 */
export function getDefectsByMonth(
  defects: Defect[],
): MonthlyDefectCount[] {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
  ];

  const counts = new Map<number, number>();

  for (let month = 1; month <= 12; month += 1) {
    counts.set(month, 0);
  }

  for (const defect of defects) {
    const date = new Date(`${defect.reportDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const month = date.getMonth() + 1;

    counts.set(
      month,
      (counts.get(month) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .filter(([month]) => month >= 1 && month <= 6)
    .map(([month, count]) => ({
      month: monthNames[month - 1],
      monthLabel: monthNames[month - 1],
      count,
    }));
}

/**
 * Daily defect reports for a selected month.
 * Includes zero-report days so the engineer can see the complete daily pattern.
 */
export function getDailyDefectsForMonth(
  defects: Defect[],
  month: string,
  year = 2026,
): DailyDefectCount[] {
  const monthIndex = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  ].indexOf(month);

  if (monthIndex < 0) {
    return [];
  }

  const daysInMonth = new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();

  const counts = new Map<number, number>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    counts.set(day, 0);
  }

  for (const defect of defects) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      defect.reportDate,
    );

    if (!match) {
      continue;
    }

    const defectYear = Number(match[1]);
    const defectMonth = Number(match[2]) - 1;
    const day = Number(match[3]);

    if (
      defectYear === year &&
      defectMonth === monthIndex &&
      counts.has(day)
    ) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([day, count]) => ({
    date: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    dateLabel: `${day} ${month}`,
    count,
  }));
}

/**
 * Distribution of severity ratings.
 *
 * 1 = most severe
 * 10 = least severe
 */
export function getSeverityDistribution(
  defects: Defect[],
): SeverityCount[] {
  const counts = new Map<number, number>();

  for (let severity = 1; severity <= 10; severity += 1) {
    counts.set(severity, 0);
  }

  for (const defect of defects) {
    counts.set(
      defect.severityRating,
      (counts.get(defect.severityRating) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries()).map(
    ([severity, count]) => ({
      severity,
      count,
    }),
  );
}

/**
 * Defect report volume by station.
 */
export function getDefectsByStation(
  defects: Defect[],
): StationDefectCount[] {
  return countBy(
    defects,
    (defect) => defect.stationName,
  ).map((item) => ({
    name: item.name,
    count: item.count,
  }));
}

/**
 * Average elapsed resolution time by station.
 *
 * Only records with a recorded resolution time are included.
 */
export function getResolutionTimeByStation(
  defects: Defect[],
): StationResolutionMetric[] {
  const grouped = new Map<
    string,
    {
      totalHours: number;
      count: number;
    }
  >();

  for (const defect of defects) {
    if (defect.resolutionTimeHours === null) {
      continue;
    }

    const existing = grouped.get(defect.stationName);

    if (existing) {
      existing.totalHours += defect.resolutionTimeHours;
      existing.count += 1;
    } else {
      grouped.set(defect.stationName, {
        totalHours: defect.resolutionTimeHours,
        count: 1,
      });
    }
  }

  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,
      averageHours:
        value.totalHours / value.count,
      resolvedReports: value.count,
    }))
    .sort(
      (a, b) =>
        b.averageHours - a.averageHours,
    );
}

/**
 * Configuration-level defect burden.
 *
 * IMPORTANT:
 * This does NOT calculate a production defect rate.
 *
 * Configuration production volumes were not supplied.
 *
 * Instead we calculate:
 *
 * 1. Defect reports
 * 2. Share of all defect reports
 * 3. Affected vehicles
 * 4. Reports per affected vehicle
 */
function getConfigurationMetrics(
  defects: Defect[],
  getValue: (defect: Defect) => string,
): ConfigurationMetric[] {
  const grouped = new Map<
    string,
    {
      reports: number;
      vins: Set<string>;
    }
  >();

  for (const defect of defects) {
    const name = getValue(defect);

    const existing = grouped.get(name);

    if (existing) {
      existing.reports += 1;
      existing.vins.add(defect.vin);
    } else {
      grouped.set(name, {
        reports: 1,
        vins: new Set([defect.vin]),
      });
    }
  }

  const totalReports = defects.length;

  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,

      defectReports: value.reports,

      reportShare:
        totalReports === 0
          ? 0
          : (value.reports / totalReports) * 100,

      affectedVehicles: value.vins.size,

      reportsPerAffectedVehicle:
        value.vins.size === 0
          ? 0
          : value.reports / value.vins.size,
    }))
    .sort(
      (a, b) =>
        b.defectReports - a.defectReports,
    );
}

export function getModelMetrics(
  defects: Defect[],
): ConfigurationMetric[] {
  return getConfigurationMetrics(
    defects,
    (defect) => defect.carModel,
  );
}

export function getMotorMetrics(
  defects: Defect[],
): ConfigurationMetric[] {
  return getConfigurationMetrics(
    defects,
    (defect) => defect.motorType,
  );
}

export function getDesignMetrics(
  defects: Defect[],
): ConfigurationMetric[] {
  return getConfigurationMetrics(
    defects,
    (defect) => defect.designPackage,
  );
}