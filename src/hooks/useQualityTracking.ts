import { useContext } from "react";
import { QualityTrackingContext } from "./qualityTrackingContext";

export function useQualityTracking() {
  const context = useContext(QualityTrackingContext);

  if (!context) {
    throw new Error(
      "useQualityTracking must be used inside QualityTrackingProvider",
    );
  }

  return context;
}
