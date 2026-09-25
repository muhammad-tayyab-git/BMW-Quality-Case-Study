/**
 * Task 5 evidence builder. The application, not the LLM, decides which rows
 * are relevant. This keeps the model on top of our analytics and gives the
 * engineer a deterministic list of rows and filters to inspect.
 */
import type { Defect } from "../types/defect";
import type { QualityTrackingRecord } from "../types/qualityTracking";
import type {
  AIInvestigationEvidencePacket,
  AIInvestigationEvidenceRow,
  EvidenceRole,
  AIInvestigationResult,
  AIInvestigationVerification,
} from "../types/aiInvestigation";

// A bounded time window prevents unrelated historical records from entering
// the AI context while still allowing a local station pattern to be reviewed.
const SAME_STATION_WINDOW_DAYS = 14;
// The case asks for a short, focused AI workflow. Limiting the supporting rows
// also makes the model's evidence set auditable and avoids sending the full dataset.
const MAX_SUPPORTING_ROWS = 24;

function reportTimestamp(defect: Defect) {
  return new Date(`${defect.reportDate}T${defect.reportTime}`).getTime();
}

function toEvidenceRow(
  defect: Defect,
  evidenceRole: EvidenceRole,
  tracking?: QualityTrackingRecord,
): AIInvestigationEvidenceRow {
  return {
    defectId: defect.defectId,
    evidenceRole,
    vin: defect.vin,
    reportDate: defect.reportDate,
    reportTime: defect.reportTime,
    productionDate: defect.productionDate,
    stationId: defect.stationId,
    stationName: defect.stationName,
    partNumber: defect.partNumber,
    partName: defect.partName,
    supplier: defect.supplier,
    defectName: defect.defectName,
    defectCategory: defect.defectCategory,
    severityRating: defect.severityRating,
    resolutionStatus: defect.resolutionStatus,
    rootCauseIdentified: defect.rootCauseIdentified,
    reworkTimeMinutes: defect.reworkTimeMinutes,
    potentialDuplicate: defect.potentialDuplicate,
    trackingSource: tracking?.source ?? null,
    trackingStatus: tracking?.trackingStatus ?? null,
    trackingNote: tracking?.note ?? null,
  };
}

export function buildAIInvestigationEvidence(
  defects: Defect[],
  trackingRecords: QualityTrackingRecord[],
  selectedTrackingId: string,
): AIInvestigationEvidencePacket | null {
  const selectedTracking = trackingRecords.find(
    (record) => record.trackingId === selectedTrackingId,
  );

  if (!selectedTracking?.defectId) return null;

  const flaggedDefectIds = [selectedTracking.defectId];
  const flaggedDefects = defects.filter((defect) =>
    flaggedDefectIds.includes(defect.defectId),
  );

  if (flaggedDefects.length === 0) return null;

  const flaggedSet = new Set(flaggedDefectIds);
  const evidenceRows: AIInvestigationEvidenceRow[] = flaggedDefects.map((defect) =>
    toEvidenceRow(
      defect,
      "flagged",
      selectedTracking,
    ),
  );

  const selected = flaggedDefects[0];
  const selectedTime = reportTimestamp(selected);
  const dayMs = 24 * 60 * 60 * 1000;

  const candidates = defects
    .filter((defect) => !flaggedSet.has(defect.defectId))
    .map((defect) => {
      const sameVin = defect.vin === selected.vin;
      const sameStationAndCategory =
        defect.stationId === selected.stationId &&
        defect.defectCategory === selected.defectCategory &&
        Math.abs(reportTimestamp(defect) - selectedTime) <=
          SAME_STATION_WINDOW_DAYS * dayMs;
      const samePartAndDefect =
        defect.partNumber === selected.partNumber &&
        defect.defectName === selected.defectName;

      if (!sameVin && !sameStationAndCategory && !samePartAndDefect) return null;

      const distance = Math.abs(reportTimestamp(defect) - selectedTime);
      const role: EvidenceRole = sameVin ? "vin-context" : "related-context";

      return {
        defect,
        role,
        distance,
        priority: sameVin ? 0 : samePartAndDefect ? 1 : 2,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.priority !== b!.priority) return a!.priority - b!.priority;
      return a!.distance - b!.distance;
    });

  const supportingRows = candidates
    .slice(0, MAX_SUPPORTING_ROWS)
    .map((candidate) =>
      toEvidenceRow(candidate!.defect, candidate!.role),
    );

  evidenceRows.push(...supportingRows);

  const sameVinCount = supportingRows.filter(
    (row) => row.evidenceRole === "vin-context",
  ).length;
  const relatedCount = supportingRows.filter(
    (row) => row.evidenceRole === "related-context",
  ).length;

  return {
    focus: {
      trackingId: selectedTracking.trackingId,
      defectId: selected.defectId,
      signalLabel: selectedTracking.signalLabel,
      metric: selectedTracking.metric,
      source: selectedTracking.source,
      trackingStatus: selectedTracking.trackingStatus,
      owner: selectedTracking.owner,
      note: selectedTracking.note,
    },
    summary: {
      totalDefectRecords: defects.length,
      evidenceRows: evidenceRows.length,
      supportingRows: supportingRows.length,
      sameVinRows: sameVinCount,
      relatedRows: relatedCount,
    },
    flaggedDefectIds,
    filters: [
      `Primary evidence: Task 3 tracking record ${selectedTracking.trackingId} → defect ${selectedTracking.defectId}.`,
      `VIN context: same VIN as flagged defect (${selected.vin}); ${sameVinCount} supporting rows retained.`,
      `Related context: same station + defect category within ±${SAME_STATION_WINDOW_DAYS} days, or same part number + defect name; ${relatedCount} supporting rows retained.`,
      `Supporting evidence is selected deterministically by the application and capped at ${MAX_SUPPORTING_ROWS} rows; the LLM cannot expand the dataset.`,
      `Source dataset available to the application: ${defects.length.toLocaleString()} defect records.`,
    ],
    evidenceRows,
  };
}


/**
 * Independently verifies the citation layer after the LLM responds. This does
 * not prove that a hypothesis is causally correct; it proves that every cited
 * defect ID actually exists in the evidence packet supplied to the model.
 * That gives the engineer a deterministic source check before reviewing the
 * wording of the AI suggestion.
 */
export function verifyAIInvestigationResult(
  result: AIInvestigationResult,
  evidenceRows: AIInvestigationEvidenceRow[],
): AIInvestigationVerification {
  const allowedIds = new Set(evidenceRows.map((row) => row.defectId));
  const findings = [
    ...result.observedPatterns,
    ...result.investigationTopics,
    ...result.recommendedChecks,
  ];

  const invalidEvidenceIds = new Set<string>();
  let citedFindingCount = 0;

  for (const finding of findings) {
    const validIds = finding.evidenceIds.filter((id) => allowedIds.has(id));
    if (validIds.length > 0) citedFindingCount += 1;

    for (const id of finding.evidenceIds) {
      if (!allowedIds.has(id)) invalidEvidenceIds.add(id);
    }
  }

  return {
    valid: findings.length === citedFindingCount && invalidEvidenceIds.size === 0,
    findingCount: findings.length,
    citedFindingCount,
    invalidEvidenceIds: [...invalidEvidenceIds],
  };
}
