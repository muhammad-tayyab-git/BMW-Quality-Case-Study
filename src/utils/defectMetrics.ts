/**
 * Task 1 KPI helpers. These functions intentionally operate on the defect
 * extract's row-level grain; vehicle-level measures use DISTINCT VIN logic.
 */
import type { Defect } from "../types/defect";

const ESTIMATED_PRODUCTION_VOLUME = 54_300;

export function getTotalDefects(defects: Defect[]): number {
  return defects.length;
}

export function getAffectedVehicles(defects: Defect[]): number {
  return new Set(defects.map((defect) => defect.vin)).size;
}

export function getDefectsPer100Vehicles(defects: Defect[]): number {


  return (
    (defects.length / ESTIMATED_PRODUCTION_VOLUME) *
    100
  );
}

export function getOpenDefects(defects: Defect[]): number {
  return defects.filter(
    (defect) => defect.resolutionStatus === "Open",
  ).length;
}

export function getAverageResolutionTime(
  defects: Defect[],
): number | null {
  const resolvedTimes = defects
    .map((defect) => defect.resolutionTimeHours)
    .filter((value): value is number => value !== null);

  if (resolvedTimes.length === 0) {
    return null;
  }

  const total = resolvedTimes.reduce(
    (sum, value) => sum + value,
    0,
  );

  return total / resolvedTimes.length;
}

export function getAverageSeverity(
  defects: Defect[],
): number | null {
  if (defects.length === 0) {
    return null;
  }

  const total = defects.reduce(
    (sum, defect) => sum + defect.severityRating,
    0,
  );

  return total / defects.length;
}
