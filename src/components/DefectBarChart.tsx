import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import type { ConfigurationMetric } from "../utils/defectAggregations";

interface DefectBarChartProps {
  title: string;
  data: ConfigurationMetric[];
}

interface ConfigurationTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ConfigurationMetric;
  }>;
}

function ConfigurationTooltip({
  active,
  payload,
}: ConfigurationTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  const calculatedTotal =
    item.reportShare === 0
      ? 0
      : Math.round(
          item.defectReports /
            (item.reportShare / 100),
        );

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #dce1e8",
        borderRadius: "10px",
        padding: "14px 16px",
        boxShadow:
          "0 8px 24px rgba(23, 32, 51, 0.14)",
        width: "270px",
        maxWidth: "calc(100vw - 32px)",
        pointerEvents: "none",
        position: "relative",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "14px",
          color: "#172033",
          marginBottom: "11px",
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          display: "grid",
          gap: "7px",
          fontSize: "13px",
          color: "#4f5b6b",
        }}
      >
        <div>
          <strong>Defect reports:</strong>{" "}
          {item.defectReports.toLocaleString()}
        </div>

        <div>
          <strong>Report share:</strong>{" "}
          {item.reportShare.toFixed(2)}%
        </div>

        <div>
          <strong>Affected vehicles:</strong>{" "}
          {item.affectedVehicles.toLocaleString()}
        </div>

        <div>
          <strong>Reports / affected vehicle:</strong>{" "}
          {item.reportsPerAffectedVehicle.toFixed(2)}
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid #edf0f4",
          fontSize: "12px",
          lineHeight: 1.5,
          color: "#687385",
        }}
      >
        <strong>Report share calculation</strong>

        <br />

        {item.defectReports.toLocaleString()} ÷{" "}
        {calculatedTotal.toLocaleString()} × 100

        <br />

        = {item.reportShare.toFixed(2)}%
      </div>

      <div
        style={{
          marginTop: "10px",
          padding: "8px 10px",
          backgroundColor: "#f5f7fa",
          borderRadius: "6px",
          fontSize: "11px",
          lineHeight: 1.5,
          color: "#687385",
        }}
      >
        A configuration-specific production defect
        rate cannot be calculated because production
        volume for this model, motor type or design
        package was not supplied.
      </div>
    </div>
  );
}

export default function DefectBarChart({
  title,
  data,
}: DefectBarChartProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e1e5eb",
        borderRadius: 2.5,
        backgroundColor: "#ffffff",

        // Important:
        // allow the Recharts tooltip to extend outside
        // the card instead of clipping it.
        overflow: "visible",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          overflow: "visible",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#172033",
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#687385",
            mb: 3,
          }}
        >
          Defect burden with report share and
          affected-vehicle context
        </Typography>

        <div
          style={{
            width: "100%",
            overflow: "visible",
          }}
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 10,
              }}
            >
              <CartesianGrid
                stroke="#e9edf2"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 12,
                  fill: "#687385",
                }}
                axisLine={{
                  stroke: "#dce1e8",
                }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: "#687385",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(31, 94, 255, 0.05)",
                }}
                content={<ConfigurationTooltip />}
                wrapperStyle={{
                  zIndex: 9999,
                  pointerEvents: "none",
                  outline: "none",
                }}
                allowEscapeViewBox={{
                  x: true,
                  y: true,
                }}
              />

              <Bar
                dataKey="defectReports"
                name="Defect reports"
                fill="#1f5eff"
                radius={[5, 5, 0, 0]}
                maxBarSize={54}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}