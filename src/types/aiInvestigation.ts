import type { TrackingStatus, TrackingSource } from "./qualityTracking";

export type EvidenceRole = "flagged" | "vin-context" | "related-context";

export interface AIInvestigationEvidenceRow {
  defectId: string;
  evidenceRole: EvidenceRole;
  vin: string;
  reportDate: string;
  reportTime: string;
  productionDate: string;
  stationId: string;
  stationName: string;
  partNumber: string;
  partName: string;
  supplier: string;
  defectName: string;
  defectCategory: string;
  severityRating: number;
  resolutionStatus: string;
  rootCauseIdentified: string | null;
  reworkTimeMinutes: number | null;
  potentialDuplicate: boolean;
  trackingSource: TrackingSource | null;
  trackingStatus: TrackingStatus | null;
  trackingNote: string | null;
}

export interface AIInvestigationEvidencePacket {
  focus: {
    trackingId: string;
    defectId: string;
    signalLabel: string;
    metric: string;
    source: TrackingSource;
    trackingStatus: TrackingStatus;
    owner: string;
    note: string;
  };
  summary: {
    totalDefectRecords: number;
    evidenceRows: number;
    supportingRows: number;
    sameVinRows: number;
    relatedRows: number;
  };
  flaggedDefectIds: string[];
  filters: string[];
  evidenceRows: AIInvestigationEvidenceRow[];
}

export interface AIInvestigationFinding {
  text: string;
  evidenceIds: string[];
}

export interface AIInvestigationResult {
  observedPatterns: AIInvestigationFinding[];
  investigationTopics: AIInvestigationFinding[];
  recommendedChecks: AIInvestigationFinding[];
}

export interface AIInvestigationResponse {
  result: AIInvestigationResult;
  evidence: AIInvestigationEvidencePacket;
  model: string;
  generatedAt: string;
}

export interface AIInvestigationVerification {
  valid: boolean;
  findingCount: number;
  citedFindingCount: number;
  invalidEvidenceIds: string[];
}
