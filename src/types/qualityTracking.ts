export type TrackingStatus =
  | "New"
  | "Investigating"
  | "Action Required"
  | "Closed";

export type TrackingSource =
  | "detector"
  | "manual"
  | "detector+manual";

/**
 * Task 3 tracks individual defect records only.
 * A chart is an analysis surface; it can lead the engineer to a record,
 * but it is not stored as a separate tracking entity.
 */
export interface QualityTrackingRecord {
  trackingId: string;
  targetKey: string;
  source: TrackingSource;
  metric: string;
  signalId: string;
  signalLabel: string;
  defectId: string;
  observedValue: number | null;
  threshold: number | null;
  direction: "high" | "low" | null;
  trackingStatus: TrackingStatus;
  owner: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackingInput {
  targetKey: string;
  source: "detector" | "manual";
  metric: string;
  signalId: string;
  signalLabel: string;
  defectId: string;
  observedValue?: number | null;
  threshold?: number | null;
  direction?: "high" | "low" | null;
  note?: string;
  trackingStatus?: TrackingStatus;
  owner?: string;
}
