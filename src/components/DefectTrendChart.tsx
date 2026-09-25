import { useMemo, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import type { Defect } from "../types/defect";
import {
  getDailyDefectsForMonth,
  type MonthlyDefectCount,
} from "../utils/defectAggregations";

interface DefectTrendChartProps {
  data: MonthlyDefectCount[];
  defects: Defect[];
}

export default function DefectTrendChart({
  data,
  defects,
}: DefectTrendChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const totalReports = data.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const dailyData = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    return getDailyDefectsForMonth(
      defects,
      selectedMonth,
    );
  }, [defects, selectedMonth]);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e1e5eb",
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
        overflow: "visible",
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
          Defect Reports Over Time
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#687385",
            mb: 3,
          }}
        >
          Monthly defect reports based on Report Date · Jan–Jun 2026
        </Typography>

        <ResponsiveContainer width="100%" height={330}>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 15,
              left: 0,
              bottom: 10,
            }}
            onClick={(state) => {
              const index = state?.activeTooltipIndex;

              if (
                index === undefined ||
                index === null
              ) {
                return;
              }

              const numericIndex = Number(index);

              if (!Number.isInteger(numericIndex)) {
                return;
              }

              const clickedMonth =
                data[numericIndex]?.monthLabel;

              if (typeof clickedMonth === "string") {
                setSelectedMonth(clickedMonth);
              }
            }}
          >
            <CartesianGrid
              stroke="#e9edf2"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="monthLabel"
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
                stroke: "#1f5eff",
                strokeWidth: 1,
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString()} reports`,
                "Defect reports",
              ]}
              labelFormatter={(label) =>
                `${label} 2026 · click the point for daily detail`
              }
              contentStyle={{
                border: "1px solid #dce1e8",
                borderRadius: "8px",
                boxShadow:
                  "0 6px 20px rgba(23, 32, 51, 0.08)",
              }}
            />

            <Line
              type="monotone"
              dataKey="count"
              name="Defect reports"
              stroke="#1f5eff"
              strokeWidth={2.5}
              dot={{
                r: 6,
                fill: "#1f5eff",
                strokeWidth: 0,
                cursor: "pointer",
              }}
              activeDot={{
                r: 8,
                cursor: "pointer",
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "#687385",
            fontWeight: 600,
          }}
        >
          Click a monthly point to drill into that month&apos;s daily reports.
        </Typography>

        {selectedMonth && (
          <Stack
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: "1px solid #e9edf2",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "8px",
              }}
            >
              <div>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#172033",
                    fontWeight: 700,
                  }}
                >
                  Daily reports — {selectedMonth} 2026
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#687385",
                  }}
                >
                  Each point is one calendar day; zero-report days are included.
                </Typography>
              </div>

              <Typography
                variant="subtitle2"
                sx={{
                  color: "#172033",
                  fontWeight: 700,
                }}
              >
                {dailyData
                  .reduce(
                    (sum, item) => sum + item.count,
                    0,
                  )
                  .toLocaleString()}{" "}
                reports
              </Typography>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={dailyData}
                margin={{
                  top: 10,
                  right: 15,
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
                  dataKey="dateLabel"
                  interval="preserveStartEnd"
                  tick={{
                    fontSize: 10,
                    fill: "#687385",
                  }}
                  axisLine={{
                    stroke: "#dce1e8",
                  }}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: "#687385",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} reports`,
                    "Daily defect reports",
                  ]}
                  labelFormatter={(label) =>
                    `${label} 2026`
                  }
                  contentStyle={{
                    border: "1px solid #dce1e8",
                    borderRadius: "8px",
                    boxShadow:
                      "0 6px 20px rgba(23, 32, 51, 0.08)",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="count"
                  name="Daily defect reports"
                  stroke="#172033"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Stack>
        )}

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "#8a94a3",
          }}
        >
          Six monthly values represent all{" "}
          {totalReports.toLocaleString()} reports in the selected
          production window.
        </Typography>
      </CardContent>
    </Card>
  );
}