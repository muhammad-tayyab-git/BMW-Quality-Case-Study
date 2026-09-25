/**
 * Task 4 aggregates existing defect rows by VIN. It is a prioritization view,
 * not a new defect classifier: a VIN enters the watchlist only because the
 * extract contains at least two reported defects for it.
 */
import type { Defect } from "../types/defect";
import type { VehicleQualitySummary } from "../types/vehicleWatchlist";
import { detectAllOutliers } from "./outlierDetection";

// Thirty minutes is used only as a transparent candidate signal for repeated
// reporting. It is deliberately not treated as proof of a duplicate defect.
const HIGH_CONFIDENCE_DUPLICATE_MINUTES = 30;

function reportTimestamp(defect: Defect): number {
  return new Date(`${defect.reportDate}T${defect.reportTime}`).getTime();
}

/**
 * Identifies records that have a strong duplicate-reporting signal:
 * same VIN + part + defect name, reported within 30 minutes.
 * This is a candidate signal, not proof that two reports describe the
 * same physical defect.
 */
export function getHighConfidenceDuplicateDefectIds(
  defects: Defect[],
): Set<string> {
  const groups = new Map<string, Defect[]>();

  for (const defect of defects) {
    const key = `${defect.vin}|${defect.partNumber}|${defect.defectName}`;
    const group = groups.get(key) ?? [];
    group.push(defect);
    groups.set(key, group);
  }

  const candidateIds = new Set<string>();

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const sorted = [...group].sort(
      (a, b) => reportTimestamp(a) - reportTimestamp(b),
    );

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const minutes =
        Math.abs(reportTimestamp(current) - reportTimestamp(previous)) /
        (1000 * 60);

      if (minutes <= HIGH_CONFIDENCE_DUPLICATE_MINUTES) {
        candidateIds.add(previous.defectId);
        candidateIds.add(current.defectId);
      }
    }
  }

  return candidateIds;
}

// Task 4 reuses Task 2 outputs to show whether a vehicle contains any
// detector-linked defects. It does not invent a new outlier score.
function getDetectorFlaggedDefectIds(defects: Defect[]): Set<string> {
  const flagged = new Set<string>();
  const summaries = detectAllOutliers(defects);

  for (const summary of summaries) {
    for (const result of summary.results) {
      if (result.source) {
        flagged.add(result.source.defectId);
        continue;
      }

      if (summary.metric === "daily-defects") {
        for (const defect of defects) {
          if (defect.reportDate === result.id) flagged.add(defect.defectId);
        }
      } else if (summary.metric === "station-defects") {
        for (const defect of defects) {
          if (defect.stationId === result.id) flagged.add(defect.defectId);
        }
      } else if (summary.metric === "vin-defects") {
        for (const defect of defects) {
          if (defect.vin === result.id) flagged.add(defect.defectId);
        }
      }
    }
  }

  return flagged;
}

// A VIN with two reports contributes one watchlist vehicle, while both rows
// remain available for inspection. This preserves the distinction between
// vehicle counts and defect-record counts established in Task 1.
export function buildVehicleQualityWatchlist(
  defects: Defect[],
): VehicleQualitySummary[] {
  const detectorFlaggedIds = getDetectorFlaggedDefectIds(defects);
  const highConfidenceDuplicateIds = getHighConfidenceDuplicateDefectIds(defects);
  const groups = new Map<string, Defect[]>();

  for (const defect of defects) {
    const group = groups.get(defect.vin) ?? [];
    group.push(defect);
    groups.set(defect.vin, group);
  }

  return Array.from(groups.entries())
    .filter(([, vehicleDefects]) => vehicleDefects.length >= 2)
    .map(([vin, vehicleDefects]) => {
      const averageSeverity =
        vehicleDefects.reduce((sum, defect) => sum + defect.severityRating, 0) /
        vehicleDefects.length;

      const severityBurden = vehicleDefects.reduce(
        (sum, defect) => sum + (11 - defect.severityRating),
        0,
      );

      return {
        vin,
        defects: vehicleDefects,
        defectCount: vehicleDefects.length,
        averageSeverity,
        mostSevereRating: Math.min(
          ...vehicleDefects.map((defect) => defect.severityRating),
        ),
        severityBurden,
        openCount: vehicleDefects.filter(
          (defect) => defect.resolutionStatus === "Open",
        ).length,
        inProgressCount: vehicleDefects.filter(
          (defect) => defect.resolutionStatus === "In Progress",
        ).length,
        detectorFlaggedCount: vehicleDefects.filter((defect) =>
          detectorFlaggedIds.has(defect.defectId),
        ).length,
        stationsInvolved: new Set(
          vehicleDefects.map((defect) => defect.stationId),
        ).size,
        potentialDuplicateCount: vehicleDefects.filter(
          (defect) => defect.potentialDuplicate,
        ).length,
        highConfidenceDuplicateCount: vehicleDefects.filter((defect) =>
          highConfidenceDuplicateIds.has(defect.defectId),
        ).length,
      };
    });
}
