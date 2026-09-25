import type { Defect } from "../types/defect";

const DATA_URL = "/data/defects.json";

/**
 * Converts one raw JSON record from the Excel-derived dataset
 * into the application's TypeScript Defect model.
 */
function mapDefect(record: Record<string, unknown>): Defect {
  return {
    defectId: String(record["Defect ID"]),

    reportDate: String(record["Report Date"]),
    reportTime: String(record["Report Time"]),
    productionDate: String(record["Production Date"]),

    vin: String(record["VIN"]),

    carModel: record["Car Model"] as Defect["carModel"],
    motorType: record["Motor Type"] as Defect["motorType"],
    designPackage:
      record["Design Package"] as Defect["designPackage"],

    stationId: String(record["Station ID"]),
    stationName: String(record["Station Name"]),
    stationNameOriginal: String(
      record["Station Name Original"],
    ),

    partNumber: String(record["Part Number"]),
    partName: String(record["Part Name"]),
    supplier: String(record["Supplier"]),

    defectName: String(record["Defect Name"]),
    defectCategory:
      record["Defect Category"] as Defect["defectCategory"],

    severityRating: Number(record["Severity Rating"]),

    inspectorId: String(record["Inspector ID"]),
    productionShift:
      record["Production Shift"] as Defect["productionShift"],

    resolutionStatus:
      record["Resolution Status"] as Defect["resolutionStatus"],

    resolutionTimestamp:
      record["Resolution Timestamp"] === null
        ? null
        : String(record["Resolution Timestamp"]),

    resolutionTimeHours:
      record["Resolution Time (hours)"] === null
        ? null
        : Number(record["Resolution Time (hours)"]),

    rootCauseIdentified:
      record["Root Cause Identified"] === null
        ? null
        : (record["Root Cause Identified"] as Defect["rootCauseIdentified"]),

    reworkTimeMinutes:
      record["Rework Time (minutes)"] === null
        ? null
        : Number(record["Rework Time (minutes)"]),

    potentialDuplicate:
      Boolean(record["Potential Duplicate"]),
  };
}

/**
 * Loads and transforms the cleaned defect dataset.
 */
export async function loadDefects(): Promise<Defect[]> {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load defect data: ${response.status} ${response.statusText}`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Defect data has an invalid format.");
  }

  return data.map((record) =>
    mapDefect(record as Record<string, unknown>),
  );
}