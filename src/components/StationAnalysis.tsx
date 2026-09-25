import { Typography } from "@mui/material";

import ResolutionStationChart from "./ResolutionStationChart";
import StationDefectChart from "./StationDefectChart";

import type { Defect } from "../types/defect";

import {
  getDefectsByStation,
  getResolutionTimeByStation,
} from "../utils/defectAggregations";

interface StationAnalysisProps {
  defects: Defect[];
}

export default function StationAnalysis({
  defects,
}: StationAnalysisProps) {
  return (
    <>
      <section className="section-heading">
        <Typography
          variant="overline"
          sx={{
            color: "#687385",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          Production station analysis
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#687385",
          }}
        >
          Report volume and resolution performance across
          the production stations.
        </Typography>
      </section>

      <section className="chart-grid">
        <StationDefectChart
          data={getDefectsByStation(defects)}
        />

        <ResolutionStationChart
          data={getResolutionTimeByStation(defects)}
        />
      </section>
    </>
  );
}