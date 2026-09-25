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

import type { CategoryCount } from "../utils/defectAggregations";

interface DefectCategoryChartProps {
  data: CategoryCount[];
}

export default function DefectCategoryChart({
  data,
}: DefectCategoryChartProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e1e5eb",
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: "#172033",
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Defects by Category
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#687385",
            mb: 3,
          }}
        >
          Distribution of reported defect categories
        </Typography>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 20,
              left: 10,
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
              type="category"
              dataKey="name"
              width={90}
              tick={{
                fontSize: 12,
                fill: "#4f5b6b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              formatter={(value) => [
                `${value} reports`,
                "Defects",
              ]}
              contentStyle={{
                border: "1px solid #dce1e8",
                borderRadius: "8px",
                boxShadow:
                  "0 6px 20px rgba(23, 32, 51, 0.08)",
              }}
            />

            <Bar
              dataKey="count"
              name="Defect reports"
              fill="#1f5eff"
              radius={[0, 5, 5, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}