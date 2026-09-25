import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CreateTrackingInput,
  QualityTrackingRecord,
  TrackingStatus,
} from "../types/qualityTracking";
import {
  QualityTrackingContext,
  type QualityTrackingContextValue,
} from "./qualityTrackingContext";

// localStorage is sufficient for this case-study prototype. A production
// implementation would move these records to an authenticated shared backend.
const STORAGE_KEY = "bmw-quality-tracking-v3";
const LEGACY_STORAGE_KEY = "bmw-quality-tracking-v2";

function loadStoredRecords(): QualityTrackingRecord[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is QualityTrackingRecord => {
      if (!item || typeof item !== "object") return false;
      const record = item as Partial<QualityTrackingRecord> & { scope?: string };
      return (
        typeof record.trackingId === "string" &&
        typeof record.targetKey === "string" &&
        typeof record.source === "string" &&
        typeof record.metric === "string" &&
        typeof record.signalId === "string" &&
        typeof record.signalLabel === "string" &&
        typeof record.defectId === "string" &&
        typeof record.trackingStatus === "string" &&
        typeof record.note === "string" &&
        typeof record.owner === "string" &&
        (!record.scope || record.scope === "record")
      );
    });
  } catch {
    return [];
  }
}

export default function QualityTrackingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [records, setRecords] = useState<QualityTrackingRecord[]>(
    loadStoredRecords,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const value = useMemo<QualityTrackingContextValue>(() => {
    const getByTargetKey = (targetKey: string) =>
      records.find((record) => record.targetKey === targetKey);

    const getByDefectId = (defectId: string) =>
      records.find((record) => record.defectId === defectId);

    // Reconcile detector and manual actions by defect ID so the same defect is
    // represented by one tracking record instead of duplicated work items.
    const flag = (input: CreateTrackingInput) => {
      const now = new Date().toISOString();
      const existing = records.find(
        (record) =>
          record.targetKey === input.targetKey ||
          record.defectId === input.defectId,
      );

      if (existing) {
        const source =
          existing.source === input.source || existing.source === "detector+manual"
            ? existing.source
            : "detector+manual";

        const updated: QualityTrackingRecord = {
          ...existing,
          source,
          metric: input.metric,
          signalId: input.signalId,
          signalLabel: input.signalLabel,
          observedValue: input.observedValue ?? existing.observedValue,
          threshold: input.threshold ?? existing.threshold,
          direction: input.direction ?? existing.direction,
          updatedAt: now,
        };

        setRecords((current) =>
          current.map((record) =>
            record.trackingId === existing.trackingId ? updated : record,
          ),
        );
        return updated;
      }

      const created: QualityTrackingRecord = {
        trackingId: `${input.defectId}:${Date.now()}`,
        targetKey: input.targetKey,
        source: input.source,
        metric: input.metric,
        signalId: input.signalId,
        signalLabel: input.signalLabel,
        defectId: input.defectId,
        observedValue: input.observedValue ?? null,
        threshold: input.threshold ?? null,
        direction: input.direction ?? null,
        trackingStatus: input.trackingStatus ?? "New",
        owner: input.owner ?? "",
        note: input.note?.trim() ?? "",
        createdAt: now,
        updatedAt: now,
      };

      setRecords((current) => [created, ...current]);
      return created;
    };

    const update = (
      trackingId: string,
      changes: Partial<
        Pick<QualityTrackingRecord, "trackingStatus" | "owner" | "note">
      >,
    ) => {
      setRecords((current) =>
        current.map((record) =>
          record.trackingId === trackingId
            ? { ...record, ...changes, updatedAt: new Date().toISOString() }
            : record,
        ),
      );
    };

    const unflag = (trackingId: string) => {
      setRecords((current) =>
        current.filter((record) => record.trackingId !== trackingId),
      );
    };

    const counts: Record<TrackingStatus, number> = {
      New: 0,
      Investigating: 0,
      "Action Required": 0,
      Closed: 0,
    };

    records.forEach((record) => {
      if (record.trackingStatus in counts) {
        counts[record.trackingStatus] += 1;
      }
    });

    return {
      records,
      flag,
      update,
      unflag,
      getByTargetKey,
      getByDefectId,
      isTracked: (targetKey: string) => Boolean(getByTargetKey(targetKey)),
      counts,
    };
  }, [records]);

  return (
    <QualityTrackingContext.Provider value={value}>
      {children}
    </QualityTrackingContext.Provider>
  );
}
