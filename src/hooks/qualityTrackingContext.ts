import { createContext } from "react";
import type {
  CreateTrackingInput,
  QualityTrackingRecord,
  TrackingStatus,
} from "../types/qualityTracking";

export interface QualityTrackingContextValue {
  records: QualityTrackingRecord[];
  flag: (input: CreateTrackingInput) => QualityTrackingRecord;
  update: (
    trackingId: string,
    changes: Partial<
      Pick<QualityTrackingRecord, "trackingStatus" | "owner" | "note">
    >,
  ) => void;
  unflag: (trackingId: string) => void;
  getByTargetKey: (targetKey: string) => QualityTrackingRecord | undefined;
  getByDefectId: (defectId: string) => QualityTrackingRecord | undefined;
  isTracked: (targetKey: string) => boolean;
  counts: Record<TrackingStatus, number>;
}

export const QualityTrackingContext = createContext<
  QualityTrackingContextValue | undefined
>(undefined);
