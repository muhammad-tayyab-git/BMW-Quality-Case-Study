import { Typography } from "@mui/material";

import DefectBarChart from "./DefectBarChart";

import type { Defect } from "../types/defect";

import {
  getDesignMetrics,
  getModelMetrics,
  getMotorMetrics,
} from "../utils/defectAggregations";

interface ConfigurationAnalysisProps {
  defects: Defect[];
}

export default function ConfigurationAnalysis({
  defects,
}: ConfigurationAnalysisProps) {
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
          Configuration analysis
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#687385",
          }}
        >
          Defect burden by configuration with report-share
          and affected-vehicle context.
        </Typography>
      </section>

      <section className="chart-grid">
        <DefectBarChart
          title="Defect Reports by Car Model"
          data={getModelMetrics(defects)}
        />

        <DefectBarChart
          title="Defect Reports by Motor Type"
          data={getMotorMetrics(defects)}
        />

        <DefectBarChart
          title="Defect Reports by Design Package"
          data={getDesignMetrics(defects)}
        />
      </section>
    </>
  );
}