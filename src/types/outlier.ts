import type { Defect } from "./defect";

export type OutlierMethod =
  | "rolling-mad"
  | "iqr"
  | "percentile"
  | "log-iqr";

export type OutlierMetric =
  | "daily-defects"
  | "station-defects"
  | "vin-defects"
  | "resolution-time"
  | "rework-time";

export type OutlierDirection = "high" | "low";

export interface OutlierResult {
  id: string;
  metric: OutlierMetric;
  method: OutlierMethod;

  value: number;
  threshold: number;

  score: number | null;

  direction: OutlierDirection;

  label: string;

  explanation: string;

  source: Defect | null;
}

export interface OutlierSummary {
  metric: OutlierMetric;
  method: OutlierMethod;

  total: number;
  flagged: number;
  share: number;

  threshold: number;

  results: OutlierResult[];
}