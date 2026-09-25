import {
  Bar,
  Cell,
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

import type { SeverityCount } from "../utils/defectAggregations";

interface SeverityDistributionChartProps {
  data: SeverityCount[];
}

export default function SeverityDistributionChart({
  data,
}: SeverityDistributionChartProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e1e5eb",
        borderRadius: 2.5,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#172033" }}
        >
          Severity Distribution
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "#687385", mb: 3 }}
        >
          1 = most severe · 10 = least severe · ratings 1–3 highlighted for review
        </Typography>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid
              stroke="#e9edf2"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="severity"
              tick={{ fontSize: 12, fill: "#687385" }}
              tickLine={false}
              axisLine={{ stroke: "#dce1e8" }}
            />

            <YAxis
              tick={{ fontSize: 12, fill: "#687385" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [
                `${value} reports`,
                "Defects",
              ]}
              contentStyle={{
                border: "1px solid #dce1e8",
                borderRadius: 8,
              }}
            />

            <Bar
              dataKey="count"
              name="Defect reports"
              radius={[5, 5, 0, 0]}
              maxBarSize={38}
            >
              {data.map((entry) => (
                <Cell
                  key={`severity-${entry.severity}`}
                  fill={entry.severity <= 3 ? "#c62828" : "#1f5eff"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}