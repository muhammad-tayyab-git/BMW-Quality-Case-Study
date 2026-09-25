import type { Defect } from "./defect";

export interface VehicleQualitySummary {
  vin: string;
  defects: Defect[];
  defectCount: number;
  averageSeverity: number;
  mostSevereRating: number;
  severityBurden: number;
  openCount: number;
  inProgressCount: number;
  detectorFlaggedCount: number;
  stationsInvolved: number;
  potentialDuplicateCount: number;
  highConfidenceDuplicateCount: number;
}
