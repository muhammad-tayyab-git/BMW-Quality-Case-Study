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

import type { StationDefectCount } from "../utils/defectAggregations";

interface StationDefectChartProps {
  data: StationDefectCount[];
}

export default function StationDefectChart({
  data,
}: StationDefectChartProps) {
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
          Defect Reports by Station
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "#687385", mb: 3 }}
        >
          Report volume across the 18 production stations
        </Typography>

        <ResponsiveContainer width="100%" height={430}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="#e9edf2"
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#687385" }}
              tickLine={false}
              axisLine={{ stroke: "#dce1e8" }}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={155}
              tick={{ fontSize: 11, fill: "#4f5b6b" }}
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
              fill="#1f5eff"
              radius={[0, 5, 5, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}