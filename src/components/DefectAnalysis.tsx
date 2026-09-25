import { Typography } from "@mui/material";

import DefectCategoryChart from "./DefectCategoryChart";
import DefectTrendChart from "./DefectTrendChart";
import SeverityDistributionChart from "./SeverityDistributionChart";
import TopDefectsChart from "./TopDefectsChart";

import type { Defect } from "../types/defect";

import {
  getDefectsByCategory,
  getDefectsByMonth,
  getSeverityDistribution,
  getTopDefects,
} from "../utils/defectAggregations";

interface DefectAnalysisProps {
  defects: Defect[];
}

export default function DefectAnalysis({
  defects,
}: DefectAnalysisProps) {
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
          Defect analysis
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#687385",
          }}
        >
          Frequency, severity and monthly defect-report
          patterns.
        </Typography>
      </section>

      {/* Top 5 */}

      <section className="chart-grid">
        <div className="chart-grid-wide">
          <TopDefectsChart
            data={getTopDefects(defects)}
          />
        </div>
      </section>

      {/* Category + severity */}

      <section className="chart-grid">
        <DefectCategoryChart
          data={getDefectsByCategory(defects)}
        />

        <SeverityDistributionChart
          data={getSeverityDistribution(defects)}
        />
      </section>

      {/* Monthly trend */}

      <section className="chart-grid">
        <div className="chart-grid-wide">
          <DefectTrendChart
            data={getDefectsByMonth(defects)}
            defects={defects}
          />
        </div>
      </section>
    </>
  );
}