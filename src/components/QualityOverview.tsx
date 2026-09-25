/**
 * Task 1 KPI layer. Keep report-level and vehicle-level units separate: a
 * defect row is not a vehicle, so only VIN-based measures use distinct VINs.
 */
import { Typography } from "@mui/material";

import KpiCard from "./KpiCard";

import type { Defect } from "../types/defect";

import {
  getAffectedVehicles,
  getAverageResolutionTime,
  getAverageSeverity,
  getDefectsPer100Vehicles,
  getOpenDefects,
  getTotalDefects,
} from "../utils/defectMetrics";

// The case supplies approximately 300 vehicles/day for 181 days. This is an
// estimated denominator, not an observed production-count field.
const ESTIMATED_PRODUCTION: number = 54_300;

interface QualityOverviewProps {
  defects: Defect[];
}

export default function QualityOverview({
  defects,
}: QualityOverviewProps) {
  const totalDefects = getTotalDefects(defects);
  const affectedVehicles = getAffectedVehicles(defects);

  const defectReportRate =
    getDefectsPer100Vehicles(defects);

  const vehicleDefectRate =
    ESTIMATED_PRODUCTION === 0
      ? 0
      : (affectedVehicles /
          ESTIMATED_PRODUCTION) *
        100;

  const reportsPerAffectedVehicle =
    affectedVehicles === 0
      ? 0
      : totalDefects / affectedVehicles;

  const openDefects = getOpenDefects(defects);

  const averageResolutionTime =
    getAverageResolutionTime(defects);

  const averageSeverity =
    getAverageSeverity(defects);

  return (
    <section>
      <Typography
        variant="overline"
        sx={{
          color: "#687385",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        Quality overview
      </Typography>

      <div className="kpi-grid">
        {/* 1. Total defect reports */}

        <KpiCard
          title="Total Defect Reports"
          value={totalDefects.toLocaleString()}
          subtitle="All reported defects"
          details="One dataset row represents one reported defect."
          formula={`COUNT(defect reports)
= ${totalDefects.toLocaleString()}`}
        />

        {/* 2. Affected vehicles */}

        <KpiCard
          title="Affected Vehicles"
          value={affectedVehicles.toLocaleString()}
          subtitle="Unique VINs"
          details="A vehicle is counted once even when it has multiple defect reports."
          formula={`COUNT(DISTINCT VIN)
= ${affectedVehicles.toLocaleString()}`}
        />

        {/* 3. Vehicle defect rate */}

        <KpiCard
          title="Vehicle Defect Rate"
          value={`${vehicleDefectRate.toFixed(1)}%`}
          subtitle="Affected vehicles / estimated production"
          details="This is the percentage of estimated produced vehicles that appear in the defect extract."
          formula={`Affected vehicles ÷ estimated production × 100

${affectedVehicles.toLocaleString()} ÷ ${ESTIMATED_PRODUCTION.toLocaleString()} × 100
= ${vehicleDefectRate.toFixed(2)}%`}
        />

        {/* 4. Defect report rate */}

        <KpiCard
          title="Defect Reports / 100 Vehicles"
          value={defectReportRate.toFixed(1)}
          subtitle="Report frequency against production"
          details="This measures defect-report volume, not the percentage of vehicles that were defective."
          formula={`Defect reports ÷ estimated production × 100

${totalDefects.toLocaleString()} ÷ ${ESTIMATED_PRODUCTION.toLocaleString()} × 100
= ${defectReportRate.toFixed(2)} reports / 100 vehicles`}
        />

        {/* 5. Reports per affected vehicle */}

        <KpiCard
          title="Reports / Affected Vehicle"
          value={reportsPerAffectedVehicle.toFixed(2)}
          subtitle="Average reported defects per affected VIN"
          details="This indicates how many defect reports are associated with each affected vehicle on average."
          formula={`Defect reports ÷ affected vehicles

${totalDefects.toLocaleString()} ÷ ${affectedVehicles.toLocaleString()}
= ${reportsPerAffectedVehicle.toFixed(2)}`}
        />

        {/* 6. Open defects */}

        <KpiCard
          title="Open Defects"
          value={openDefects.toLocaleString()}
          subtitle="Currently open"
          details="Records whose resolution status is Open."
          formula={`COUNT(status = "Open")
= ${openDefects.toLocaleString()}`}
        />

        {/* 7. Resolution time */}

        <KpiCard
          title="Avg. Resolution Time"
          value={
            averageResolutionTime === null
              ? "N/A"
              : `${averageResolutionTime.toFixed(1)} h`
          }
          subtitle="Records with resolution time"
          details="Average elapsed resolution time using records with a recorded resolution time."
          formula={
            averageResolutionTime === null
              ? "No resolution-time records available."
              : `SUM(resolution time) ÷ records with resolution time

= ${averageResolutionTime.toFixed(2)} hours`
          }
        />

        {/* 8. Severity */}

        <KpiCard
          title="Average Severity"
          value={
            averageSeverity === null
              ? "N/A"
              : averageSeverity.toFixed(1)
          }
          subtitle="1 = most severe · 10 = least"
          details="Average of the supplied 1–10 severity rating."
          formula={
            averageSeverity === null
              ? "No severity records available."
              : `SUM(severity ratings) ÷ defect reports

= ${averageSeverity.toFixed(2)}`
          }
        />
      </div>
    </section>
  );
}