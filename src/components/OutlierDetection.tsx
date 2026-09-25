import { useMemo, useState } from "react";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Defect } from "../types/defect";
import type {
  OutlierMetric,
  OutlierResult,
  OutlierSummary,
} from "../types/outlier";
import {
  detectAllOutliers,
  detectDailyOutliers,
} from "../utils/outlierDetection";
import { useQualityTracking } from "../hooks/useQualityTracking";
import type { TrackingStatus } from "../types/qualityTracking";

interface OutlierDetectionProps {
  defects: Defect[];
}

type MetricDefinition = {
  metric: OutlierMetric;
  title: string;
  shortTitle: string;
  description: string;
  method: string;
  methodTitle: string;
  rationale: string;
  assumption: string;
  unit: string;
};

const METRICS: MetricDefinition[] = [
  {
    metric: "daily-defects",
    title: "Daily defect volume",
    shortTitle: "Daily volume",
    description: "Detects days whose report volume is unusual versus the recent baseline.",
    method: "rolling-mad",
    methodTitle: "Rolling median + MAD",
    rationale:
      "A rolling baseline adapts to changing production conditions. Median and MAD are resistant to isolated spikes, so one unusually busy or quiet day does not redefine the baseline.",
    assumption:
      "The previous 28 evaluated days provide a useful local baseline. The first 28 days are a warm-up period and are not scored.",
    unit: "reports / day",
  },
  {
    metric: "station-defects",
    title: "Station defect volume",
    shortTitle: "Station volume",
    description: "Finds stations with unusually high defect-report counts compared with other stations.",
    method: "iqr",
    methodTitle: "IQR upper fence",
    rationale:
      "The station counts are compared as a cross-station distribution. IQR is robust to a small number of high-volume stations and does not require a normal distribution.",
    assumption:
      "Station report counts are comparable enough to identify unusual concentration. This is a defect-volume signal, not a station defect rate, because station production denominators are unavailable.",
    unit: "reports / station",
  },
  {
    metric: "vin-defects",
    title: "Defects per VIN",
    shortTitle: "Repeat-defect VINs",
    description: "Finds vehicles with an unusually high number of reported defects.",
    method: "percentile",
    methodTitle: "99th percentile",
    rationale:
      "The distribution is highly discrete: almost all VINs have one or two reports. A high percentile identifies the rare upper tail without imposing a fixed defect-count cutoff.",
    assumption:
      "The upper 1% of the observed VIN distribution is a useful rarity definition. The threshold is recalculated when the data changes.",
    unit: "reports / VIN",
  },
  {
    metric: "resolution-time",
    title: "Resolution time",
    shortTitle: "Resolution time",
    description: "Flags unusually long elapsed time between defect reporting and resolution.",
    method: "log-iqr",
    methodTitle: "log1p transformation + IQR",
    rationale:
      "Resolution time is strongly right-skewed. Log1p reduces the influence of extreme durations before applying the IQR rule, then the threshold is converted back to hours.",
    assumption:
      "The resolved records provide a meaningful distribution of elapsed resolution times. Unresolved defects are excluded because they do not have a completed elapsed time.",
    unit: "hours / defect",
  },
  {
    metric: "rework-time",
    title: "Rework time",
    shortTitle: "Rework time",
    description: "Flags defects requiring unusually long hands-on repair time.",
    method: "iqr",
    methodTitle: "IQR upper fence",
    rationale:
      "Rework time is comparatively well behaved in this extract, so the standard IQR rule provides an interpretable adaptive upper boundary without a fixed minute cutoff.",
    assumption:
      "Resolved rework durations are comparable enough for a common upper-tail rule. Unresolved defects are excluded because rework time is not yet recorded.",
    unit: "minutes / defect",
  },
];

const METRIC_ICONS: Record<OutlierMetric, string> = {
  "daily-defects": "DAY",
  "station-defects": "ST",
  "vin-defects": "VIN",
  "resolution-time": "RES",
  "rework-time": "RW",
};

function getMetricDefinition(metric: OutlierMetric) {
  return METRICS.find((item) => item.metric === metric) ?? METRICS[0];
}

function formatMetricValue(metric: OutlierMetric, value: number) {
  if (metric === "resolution-time") return `${value.toFixed(2)} h`;
  if (metric === "rework-time") return `${value.toFixed(0)} min`;
  return `${value.toLocaleString()} reports`;
}

function getDirectionLabel(direction: OutlierResult["direction"]) {
  return direction === "high" ? "High signal" : "Low signal";
}

function getStationName(defects: Defect[], stationId: string) {
  return (
    defects.find((defect) => defect.stationId === stationId)?.stationName ??
    "Station name not available"
  );
}

function getResultLabel(
  metric: OutlierMetric,
  result: OutlierResult,
  defects: Defect[],
) {
  if (metric === "daily-defects") return result.id;
  if (metric === "station-defects") {
    return `${result.id} · ${getStationName(defects, result.id)}`;
  }
  if (metric === "vin-defects") return result.id;
  return result.id;
}

function getRelatedDefectIds(
  metric: OutlierMetric,
  result: OutlierResult,
  defects: Defect[],
) {
  if (metric === "daily-defects") {
    return defects
      .filter((defect) => defect.reportDate === result.id)
      .map((defect) => defect.defectId);
  }
  if (metric === "station-defects") {
    return defects
      .filter((defect) => defect.stationId === result.id)
      .map((defect) => defect.defectId);
  }
  if (metric === "vin-defects") {
    return defects
      .filter((defect) => defect.vin === result.id)
      .map((defect) => defect.defectId);
  }
  return result.source ? [result.source.defectId] : [result.id];
}

function getResultContext(
  metric: OutlierMetric,
  result: OutlierResult,
  defects: Defect[],
) {
  if (result.source) {
    return result.source;
  }

  if (metric === "daily-defects") {
    const rows = defects.filter((defect) => defect.reportDate === result.id);
    return rows[0] ?? null;
  }

  if (metric === "station-defects") {
    const rows = defects.filter((defect) => defect.stationId === result.id);
    return rows[0] ?? null;
  }

  if (metric === "vin-defects") {
    const rows = defects.filter((defect) => defect.vin === result.id);
    return rows[0] ?? null;
  }

  return null;
}

type ChartReview = {
  metric: OutlierMetric;
  label: string;
  value: number;
  threshold: number | null;
  direction: "high" | "low" | null;
  relatedDefects: Defect[];
  detectorResult?: OutlierResult;
};

function MetricCard({
  summary,
  active,
  definition,
  onClick,
}: {
  summary: OutlierSummary;
  active: boolean;
  definition: MetricDefinition;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: "100%",
        border: active
          ? "1px solid #1f5eff"
          : "1px solid #e1e5eb",
        borderRadius: 2.5,
        cursor: "pointer",
        backgroundColor: active ? "#f7f9ff" : "#ffffff",
        transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(23, 32, 51, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
          <Box>
            <Typography variant="body2" sx={{ color: "#687385", fontWeight: 700 }}>
              {definition.shortTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "#8a94a3" }}>
              {definition.methodTitle}
            </Typography>
          </Box>
          <Box
            sx={{
              minWidth: 38,
              height: 32,
              px: 1,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "#e8efff" : "#f1f4f7",
              color: active ? "#1f5eff" : "#687385",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {METRIC_ICONS[summary.metric]}
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            mt: 1.75,
            color: "#172033",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          {summary.flagged.toLocaleString()}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: "#687385" }}>
            flagged
          </Typography>
          <Chip
            size="small"
            label={`${(summary.share * 100).toFixed(2)}%`}
            sx={{
              height: 24,
              fontWeight: 700,
              color: summary.flagged > 0 ? "#9b3f00" : "#3b6b4a",
              backgroundColor: summary.flagged > 0 ? "#fff1e8" : "#edf7f0",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function OutlierDetection({ defects }: OutlierDetectionProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<OutlierMetric>("daily-defects");
  const [dailyWindow, setDailyWindow] = useState(28);
  const [dailyScoreThreshold, setDailyScoreThreshold] = useState(2.5);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResult, setSelectedResult] =
    useState<OutlierResult | null>(null);
  const [selectedChartReview, setSelectedChartReview] = useState<ChartReview | null>(null);

  const { flag, isTracked, getByTargetKey } = useQualityTracking();

  const summaries = useMemo(() => {
    const base = detectAllOutliers(defects);
    const daily = detectDailyOutliers(
      defects,
      dailyWindow,
      dailyScoreThreshold,
    );

    return base.map((summary) =>
      summary.metric === "daily-defects" ? daily : summary,
    );
  }, [defects, dailyScoreThreshold, dailyWindow]);

  const selectedSummary =
    summaries.find((summary) => summary.metric === selectedMetric) ??
    summaries[0];

  const definition = getMetricDefinition(selectedMetric);

  const filteredResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return selectedSummary.results.filter((result) => {
      if (!normalized) return true;

      const context = getResultContext(
        selectedMetric,
        result,
        defects,
      );

      const searchable = [
        result.id,
        result.label,
        result.explanation,
        context?.vin,
        context?.defectName,
        context?.stationName,
        context?.carModel,
        context?.defectCategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [defects, search, selectedMetric, selectedSummary]);

  const pagedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const flaggedTotal = summaries.reduce(
    (sum, summary) => sum + summary.flagged,
    0,
  );

  const selectedContext = selectedResult
    ? getResultContext(selectedMetric, selectedResult, defects)
    : null;

  function trackingKeyForResult(metric: OutlierMetric, result: OutlierResult) {
    return `detector:${metric}:${result.id}`;
  }

  function handleTrackResult(result: OutlierResult, note = "", trackingStatus: TrackingStatus = "New") {
    const recordLevel =
      selectedMetric === "resolution-time" || selectedMetric === "rework-time";

    if (!recordLevel || !result.source) {
      openChartReview(result);
      return;
    }

    flag({
      targetKey: `detector:${selectedMetric}:${result.id}`,
      source: "detector",
      metric: selectedMetric,
      signalId: result.id,
      signalLabel: getResultLabel(selectedMetric, result, defects),
      defectId: result.source.defectId,
      observedValue: result.value,
      threshold: result.threshold,
      direction: result.direction,
      note,
      trackingStatus,
    });
  }

  function openChartReview(result: OutlierResult) {
    const relatedDefects = getRelatedDefectIds(selectedMetric, result, defects)
      .map((id) => defects.find((defect) => defect.defectId === id))
      .filter((defect): defect is Defect => Boolean(defect));

    setSelectedChartReview({
      metric: selectedMetric,
      label: getResultLabel(selectedMetric, result, defects),
      value: result.value,
      threshold: result.threshold,
      direction: result.direction,
      relatedDefects,
      detectorResult: result,
    });
  }

  function openChartReviewForAggregate(
    label: string,
    value: number,
    relatedDefects: Defect[],
    detectorResult?: OutlierResult,
  ) {
    setSelectedChartReview({
      metric: selectedMetric,
      label,
      value,
      threshold: detectorResult?.threshold ?? selectedSummary.threshold,
      direction: detectorResult?.direction ?? null,
      relatedDefects,
      detectorResult,
    });
  }


  const dailyChartData = useMemo(() => {
    const counts = new Map<string, number>();

    defects.forEach((defect) => {
      counts.set(
        defect.reportDate,
        (counts.get(defect.reportDate) ?? 0) + 1,
      );
    });

    const flagged = new Map(
      selectedSummary.results.map((result) => [result.id, result]),
    );

    return Array.from(counts.entries()).map(([date, count]) => {
      const result = flagged.get(date);
      return {
        date,
        count,
        flagged: result ? count : null,
        threshold: result?.threshold ?? null,
      };
    });
  }, [defects, selectedSummary]);

  const stationChartData = useMemo(() => {
    const counts = new Map<string, number>();

    defects.forEach((defect) => {
      counts.set(
        defect.stationId,
        (counts.get(defect.stationId) ?? 0) + 1,
      );
    });

    const flagged = new Set(
      selectedSummary.results.map((result) => result.id),
    );

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([stationId, count]) => ({
        stationId,
        count,
        flagged: flagged.has(stationId) ? count : null,
      }));
  }, [defects, selectedSummary]);

  const vinDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    defects.forEach((defect) => {
      counts.set(defect.vin, (counts.get(defect.vin) ?? 0) + 1);
    });

    const distribution = new Map<number, number>();

    counts.forEach((count) => {
      distribution.set(count, (distribution.get(count) ?? 0) + 1);
    });

    return Array.from(distribution.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([reports, vehicles]) => ({
        reports,
        vehicles,
        flagged: reports > selectedSummary.threshold ? vehicles : 0,
      }));
  }, [defects, selectedSummary]);

  function handleMetricChange(metric: OutlierMetric) {
    setSelectedMetric(metric);
    setSearch("");
    setPage(0);
    setSelectedResult(null);
  }

  function handleRowsPerPageChange(value: number) {
    setRowsPerPage(value);
    setPage(0);
  }

  return (
    <section className="outlier-section">
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "#1f5eff",
                fontWeight: 800,
                letterSpacing: "0.1em",
              }}
            >
              Task 2 · Dynamic outlier detection
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                mt: 0.25,
                fontWeight: 800,
                color: "#172033",
                letterSpacing: "-0.025em",
              }}
            >
              Find unusual quality signals without fixed cutoffs
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: "#687385", maxWidth: 820 }}
            >
              Five adaptive detectors scan daily volume, station concentration,
              repeat-defect vehicles and resolution performance. The thresholds
              are calculated from the current data rather than hard-coded production limits.
            </Typography>
          </Box>

          <Chip
            icon={<WarningAmberRoundedIcon />}
            label={`${flaggedTotal.toLocaleString()} flagged signals`}
            sx={{
              fontWeight: 800,
              color: "#8b3d00",
              backgroundColor: "#fff1e8",
              border: "1px solid #ffd9c2",
            }}
          />
        </Box>
      </Box>

      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          mb: 2.5,
          border: "1px solid #d7e4ff",
          backgroundColor: "#f5f8ff",
          color: "#33445f",
          "& .MuiAlert-icon": { color: "#1f5eff" },
        }}
      >
        <strong>How to use this view:</strong> a flag means the observed value
        is unusual under the selected adaptive rule. It is a review signal,
        not proof of a root cause or a defect in the process.
      </Alert>

      <div className="outlier-metric-grid">
        {summaries.map((summary) => (
          <MetricCard
            key={summary.metric}
            summary={summary}
            active={summary.metric === selectedMetric}
            definition={getMetricDefinition(summary.metric)}
            onClick={() => handleMetricChange(summary.metric)}
          />
        ))}
      </div>

      <Card
        elevation={0}
        sx={{
          mt: 2.5,
          border: "1px solid #e1e5eb",
          borderRadius: 2.5,
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#172033" }}>
                {definition.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "#687385", mt: 0.4 }}>
                {definition.description}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.25 }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric"
                  onChange={(event) =>
                    handleMetricChange(event.target.value as OutlierMetric)
                  }
                >
                  {METRICS.map((metric) => (
                    <MenuItem key={metric.metric} value={metric.metric}>
                      {metric.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedMetric === "daily-defects" && (
                <>
                  <FormControl size="small" sx={{ minWidth: 155 }}>
                    <InputLabel>Baseline window</InputLabel>
                    <Select
                      value={dailyWindow}
                      label="Baseline window"
                      onChange={(event) => {
                        setDailyWindow(Number(event.target.value));
                        setPage(0);
                      }}
                    >
                      <MenuItem value={14}>14 days</MenuItem>
                      <MenuItem value={21}>21 days</MenuItem>
                      <MenuItem value={28}>28 days</MenuItem>
                      <MenuItem value={42}>42 days</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Robust score</InputLabel>
                    <Select
                      value={dailyScoreThreshold}
                      label="Robust score"
                      onChange={(event) => {
                        setDailyScoreThreshold(Number(event.target.value));
                        setPage(0);
                      }}
                    >
                      <MenuItem value={2}>2.0</MenuItem>
                      <MenuItem value={2.5}>2.5</MenuItem>
                      <MenuItem value={3}>3.0</MenuItem>
                      <MenuItem value={3.5}>3.5</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { xs: "stretch", md: "center" } }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                <TuneOutlinedIcon sx={{ fontSize: 19, color: "#1f5eff" }} />
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#172033" }}>
                  {definition.methodTitle}
                </Typography>
                <Tooltip
                  title={`${definition.rationale} Assumption: ${definition.assumption}`}
                  arrow
                >
                  <IconButton size="small" aria-label="Explain detection method">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ color: "#687385", mt: 0.5, lineHeight: 1.65 }}>
                {definition.rationale}
              </Typography>
            </Box>

            <Box className="outlier-rule-box">
              <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>
                Adaptive rule
              </Typography>
              <Typography variant="body2" sx={{ color: "#172033", fontWeight: 800, mt: 0.35 }}>
                {selectedMetric === "daily-defects"
                  ? `${dailyWindow}-day baseline · score > ${dailyScoreThreshold} or < -${dailyScoreThreshold}`
                  : `Threshold = ${formatMetricValue(selectedMetric, selectedSummary.threshold)}`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2.5 }}>
            {selectedMetric === "daily-defects" && (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={dailyChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  onClick={(state) => {
                    const index = state?.activeTooltipIndex;
                    if (index === null || index === undefined) return;
                    const numericIndex = Number(index);
                    if (!Number.isInteger(numericIndex)) return;
                    const item = dailyChartData[numericIndex];
                    if (!item) return;
                    const result = selectedSummary.results.find((candidate) => candidate.id === item.date);
                    const related = defects.filter((defect) => defect.reportDate === item.date);
                    openChartReviewForAggregate(item.date, item.count, related, result);
                  }}
                >
                  <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#687385" }}
                    tickFormatter={(value) => String(value).slice(5)}
                    axisLine={{ stroke: "#dce1e8" }}
                    tickLine={false}
                    minTickGap={18}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#687385" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    formatter={(value, name) => [
                      value === null ? "—" : `${Number(value).toFixed(0)} reports`,
                      name === "flagged" ? "Flagged day" : name === "threshold" ? "Adaptive threshold" : "Daily reports",
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="#1f5eff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="threshold" stroke="#b8c2d0" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="flagged" stroke="#d65a1f" strokeWidth={0} dot={{ r: 5, fill: "#d65a1f", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {selectedMetric === "station-defects" && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stationChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                  onClick={(state) => {
                    const index = state?.activeTooltipIndex;
                    if (index === null || index === undefined) return;
                    const numericIndex = Number(index);
                    if (!Number.isInteger(numericIndex)) return;
                    const item = stationChartData[numericIndex];
                    if (!item) return;
                    const result = selectedSummary.results.find((candidate) => candidate.id === item.stationId);
                    const related = defects.filter((defect) => defect.stationId === item.stationId);
                    openChartReviewForAggregate(
                      `${item.stationId} · ${getStationName(defects, item.stationId)}`,
                      item.count,
                      related,
                      result,
                    );
                  }}
                >
                  <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stationId" tick={{ fontSize: 10, fill: "#687385" }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#687385" }} axisLine={false} tickLine={false} />
                  <ChartTooltip formatter={(value) => [`${Number(value).toLocaleString()} reports`, "Station volume"]} />
                  <ReferenceLine y={selectedSummary.threshold} stroke="#d65a1f" strokeDasharray="5 5" />
                  <Bar dataKey="count" name="Station defect reports" radius={[5, 5, 0, 0]}>
                    {stationChartData.map((item) => (
                      <Cell key={item.stationId} fill={item.flagged !== null ? "#d65a1f" : "#6f8fc4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {selectedMetric === "vin-defects" && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={vinDistribution}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  onClick={(state) => {
                    const index = state?.activeTooltipIndex;
                    if (index === null || index === undefined) return;
                    const numericIndex = Number(index);
                    if (!Number.isInteger(numericIndex)) return;
                    const item = vinDistribution[numericIndex];
                    if (!item) return;
                    const vinCounts = new Map<string, number>();
                    defects.forEach((defect) => {
                      vinCounts.set(defect.vin, (vinCounts.get(defect.vin) ?? 0) + 1);
                    });
                    const bucketRecords = defects.filter(
                      (defect) => vinCounts.get(defect.vin) === item.reports,
                    );
                    const firstResult = selectedSummary.results.find((candidate) => {
                      const firstVin = bucketRecords[0]?.vin;
                      return firstVin ? candidate.id === firstVin : false;
                    });
                    openChartReviewForAggregate(
                      `${item.reports} defects per VIN · ${item.vehicles.toLocaleString()} VINs`,
                      item.reports,
                      bucketRecords,
                      firstResult,
                    );
                  }}
                >
                  <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="reports" tickFormatter={(value) => `${value}`} tick={{ fontSize: 11, fill: "#687385" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#687385" }} axisLine={false} tickLine={false} />
                  <ChartTooltip formatter={(value) => [`${Number(value).toLocaleString()} VINs`, "Vehicles"]} labelFormatter={(label) => `${label} reported defects per VIN`} />
                  <Bar dataKey="vehicles" name="Affected VINs" radius={[5, 5, 0, 0]}>
                    {vinDistribution.map((item) => (
                      <Cell key={item.reports} fill={item.flagged > 0 ? "#d65a1f" : "#6f8fc4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {(selectedMetric === "resolution-time" || selectedMetric === "rework-time") && (
              <DurationChart
                defects={defects}
                metric={selectedMetric}
                threshold={selectedSummary.threshold}
                onBinClick={(bin) => {
                  setSelectedChartReview({
                    metric: selectedMetric,
                    label: `${bin.range} ${selectedMetric === "resolution-time" ? "hours" : "minutes"}`,
                    value: bin.total,
                    threshold: selectedSummary.threshold,
                    direction: "high",
                    relatedDefects: bin.records,
                  });
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          mt: 2.5,
          border: "1px solid #e1e5eb",
          borderRadius: 2.5,
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#172033" }}>
                Flagged signals
              </Typography>
              <Typography variant="body2" sx={{ color: "#687385", mt: 0.4 }}>
                Select a row to see the plain-language reason and supporting record context.
              </Typography>
            </Box>

            <TextField
              size="small"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search flagged signals"
              sx={{ minWidth: { xs: "100%", md: 300 } }}
            />
          </Box>
        </CardContent>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f7f9fb" }}>
                <TableCell sx={{ fontWeight: 800 }}>Signal</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Observed</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Adaptive threshold</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Direction</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Why flagged</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tracking</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedResults.map((result) => (
                <TableRow
                  key={`${selectedMetric}-${result.id}`}
                  hover
                  onClick={() => setSelectedResult(result)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 750, color: "#172033" }}>
                      {getResultLabel(selectedMetric, result, defects)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatMetricValue(selectedMetric, result.value)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatMetricValue(selectedMetric, result.threshold)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getDirectionLabel(result.direction)}
                      sx={{
                        height: 24,
                        fontWeight: 700,
                        color: result.direction === "high" ? "#9b3f00" : "#315b79",
                        backgroundColor: result.direction === "high" ? "#fff1e8" : "#eef5fb",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 520 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#5f6b7a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {result.explanation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {selectedMetric === "resolution-time" || selectedMetric === "rework-time" ? (
                      <Button
                        size="small"
                        variant={isTracked(`detector:${selectedMetric}:${result.id}`) ? "outlined" : "contained"}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedResult(result);
                        }}
                      >
                        {isTracked(`detector:${selectedMetric}:${result.id}`) ? "Tracked" : "Review & flag"}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          openChartReview(result);
                        }}
                      >
                        Review records
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Explain this flag">
                      <IconButton
                        size="small"
                        aria-label={`Explain ${result.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedResult(result);
                        }}
                      >
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {pagedResults.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#172033" }}>
                        No flagged signals match this search.
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#687385", mt: 0.5 }}>
                        Try a different search term or select another metric.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredResults.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) =>
            handleRowsPerPageChange(Number(event.target.value))
          }
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <Card
        elevation={0}
        sx={{
          mt: 2.5,
          border: "1px solid #e1e5eb",
          borderRadius: 2.5,
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#172033" }}>
            What this detector can and cannot tell you
          </Typography>
          <div className="outlier-explanation-grid">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#315b79" }}>
                It can tell you
              </Typography>
              <Typography variant="body2" sx={{ color: "#687385", mt: 0.6, lineHeight: 1.7 }}>
                which observations are unusual under a documented, adaptive rule;
                how many were flagged; and the evidence used to trigger the flag.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#9b3f00" }}>
                It cannot tell you
              </Typography>
              <Typography variant="body2" sx={{ color: "#687385", mt: 0.6, lineHeight: 1.7 }}>
                that a flagged record is necessarily wrong, caused by one factor,
                or statistically significant in a formal hypothesis-test sense.
                Investigation still requires process context.
              </Typography>
            </Box>
          </div>
        </CardContent>
      </Card>

      {selectedChartReview && (
        <ChartRecordReviewDrawer
          review={selectedChartReview}
          onClose={() => setSelectedChartReview(null)}
          onTrackDefect={(defect, note, trackingStatus) => {
            const metric = selectedChartReview.metric;
            const isDurationMetric =
              metric === "resolution-time" || metric === "rework-time";
            const value =
              metric === "resolution-time"
                ? defect.resolutionTimeHours
                : metric === "rework-time"
                  ? defect.reworkTimeMinutes
                  : null;
            const detectorFlagged =
              isDurationMetric &&
              value !== null &&
              selectedChartReview.threshold !== null &&
              value > selectedChartReview.threshold;

            flag({
              targetKey: detectorFlagged
                ? `detector:${metric}:${defect.defectId}`
                : `manual:chart:${metric}:${defect.defectId}`,
              source: detectorFlagged ? "detector" : "manual",
              metric,
              signalId: defect.defectId,
              signalLabel: `${defect.defectId} · ${defect.defectName}`,
              defectId: defect.defectId,
              observedValue: value,
              threshold: selectedChartReview.threshold,
              direction: detectorFlagged ? selectedChartReview.direction : null,
              note,
              trackingStatus,
            });
          }}
        />
      )}

      {selectedResult && (
        <DetailDialog
          metric={selectedMetric}
          result={selectedResult}
          definition={definition}
          context={selectedContext}
          defects={defects}
          onClose={() => setSelectedResult(null)}
          tracked={Boolean(getByTargetKey(trackingKeyForResult(selectedMetric, selectedResult)))}
          onTrack={(note, trackingStatus) => handleTrackResult(selectedResult, note, trackingStatus)}
          onReviewRecords={() => {
            openChartReview(selectedResult);
            setSelectedResult(null);
          }}
        />
      )}
    </section>
  );
}

type DurationBin = {
  range: string;
  start: number;
  end: number;
  records: Defect[];
  total: number;
  flagged: number;
};

function DurationChart({
  defects,
  metric,
  threshold,
  onBinClick,
}: {
  defects: Defect[];
  metric: "resolution-time" | "rework-time";
  threshold: number;
  onBinClick: (bin: DurationBin) => void;
}) {
  const bins = metric === "resolution-time"
    ? [0, 5, 10, 15, 20, 25, 30, 40, 60, 100, 150, 200, 300]
    : [0, 30, 60, 90, 120, 150, 180, 210];

  const chartData = bins.slice(0, -1).map((start, index) => {
    const end = bins[index + 1];
    const records = defects.filter((defect) => {
      const value = metric === "resolution-time"
        ? defect.resolutionTimeHours
        : defect.reworkTimeMinutes;
      return value !== null && Number.isFinite(value) && value > start && value <= end;
    });

    const flagged = records.filter((defect) => {
      const value = metric === "resolution-time"
        ? defect.resolutionTimeHours
        : defect.reworkTimeMinutes;
      return value !== null && value > threshold;
    }).length;

    return {
      range: `${start}–${end}`,
      start,
      end,
      total: records.length,
      within: records.length - flagged,
      flagged,
      records,
    };
  });

  const unit = metric === "resolution-time" ? "hours" : "minutes";

  return (
    <Box>
      <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>
        Distribution of evaluated durations · flagged observations are highlighted
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
          onClick={(state) => {
            const index = state?.activeTooltipIndex;
            if (index === null || index === undefined) return;
            const numericIndex = Number(index);
            if (!Number.isInteger(numericIndex)) return;
            const bin = chartData[numericIndex];
            if (bin && bin.total > 0) {
              onBinClick(bin);
            }
          }}
        >
          <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#687385" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#687385" }} axisLine={false} tickLine={false} />
          <ChartTooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()} records`,
              name === "flagged" ? "Already above threshold" : "Within threshold",
            ]}
            labelFormatter={(label) => `${label} ${unit} · click to review individual records`}
          />
          <Bar dataKey="within" stackId="duration" name="Within threshold" fill="#6f8fc4" radius={[5, 5, 0, 0]}>
            {chartData.map((item) => (
              <Cell key={item.range} fill="#6f8fc4" />
            ))}
          </Bar>
          <Bar dataKey="flagged" stackId="duration" name="flagged" fill="#d65a1f" radius={[5, 5, 0, 0]}>
            {chartData.map((item) => (
              <Cell key={`flagged-${item.range}`} fill="#d65a1f" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function ChartRecordReviewDrawer({
  review,
  onClose,
  onTrackDefect,
}: {
  review: ChartReview;
  onClose: () => void;
  onTrackDefect: (defect: Defect, note: string, trackingStatus: TrackingStatus) => void;
}) {
  const { records: trackingRecords } = useQualityTracking();
  const [search, setSearch] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<string, TrackingStatus>>({});

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return review.relatedDefects.filter((defect) => {
      if (!query) return true;
      return [
        defect.defectId,
        defect.vin,
        defect.defectName,
        defect.stationId,
        defect.stationName,
        defect.defectCategory,
        defect.resolutionStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [review.relatedDefects, search]);

  const selectedValueLabel =
    review.metric === "daily-defects"
      ? `${review.value.toLocaleString()} reports on the selected day`
      : review.metric === "station-defects"
        ? `${review.value.toLocaleString()} reports at the selected station`
        : review.metric === "vin-defects"
          ? `${review.value.toLocaleString()} defects per VIN in the selected bucket`
          : `selected duration bucket`;

  return (
    <Drawer anchor="right" open onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 760 }, p: { xs: 2, sm: 3 } }}>
        <Typography variant="overline" sx={{ color: "#1f5eff", fontWeight: 800 }}>
          Chart investigation
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 850, color: "#172033", mt: 0.25 }}>
          {review.label}
        </Typography>
        <Typography variant="body2" sx={{ color: "#687385", mt: 0.7, lineHeight: 1.7 }}>
          The chart element is an aggregate view. It does not create a tracking item by itself. Review the underlying defect records and flag only the record or records that need quality follow-up.
        </Typography>

        <Box sx={{ mt: 2, p: 1.75, backgroundColor: "#f7f9fb", borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "#172033" }}>
            Chart context: {selectedValueLabel}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: "#687385", mt: 0.35 }}>
            {review.relatedDefects.length.toLocaleString()} underlying defect records are available for review.
          </Typography>
          {review.threshold !== null && (
            <Typography variant="caption" sx={{ display: "block", color: "#687385", mt: 0.25 }}>
              Adaptive threshold: {formatMetricValue(review.metric, review.threshold)}
            </Typography>
          )}
          {review.detectorResult && (
            <Typography variant="caption" sx={{ display: "block", color: "#9b3f00", mt: 0.25 }}>
              Task 2 identified this aggregate observation as unusual; individual defects still require engineering selection.
            </Typography>
          )}
        </Box>

        <TextField
          size="small"
          fullWidth
          label="Find a defect in this chart selection"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mt: 2 }}
        />

        <TableContainer sx={{ mt: 1.5, maxHeight: "55vh" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Defect</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Station</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Resolution</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Engineer observation</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 145 }}>Tracking status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRecords.slice(0, 150).map((defect) => {
                const tracked = trackingRecords.some(
                  (record) => record.defectId === defect.defectId,
                );
                const value =
                  review.metric === "resolution-time"
                    ? defect.resolutionTimeHours
                    : review.metric === "rework-time"
                      ? defect.reworkTimeMinutes
                      : null;
                const aboveThreshold =
                  value !== null &&
                  review.threshold !== null &&
                  value > review.threshold;

                return (
                  <TableRow key={defect.defectId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {defect.defectId}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#687385" }}>
                        {defect.vin} · {defect.defectName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {value === null
                        ? "—"
                        : review.metric === "resolution-time"
                          ? `${value.toFixed(2)} h`
                          : review.metric === "rework-time"
                            ? `${value.toFixed(0)} min`
                            : `Severity ${defect.severityRating}`}
                      {aboveThreshold && (
                        <Chip
                          size="small"
                          label="Detector flagged"
                          sx={{ ml: 0.75, color: "#9b3f00", backgroundColor: "#fff1e8" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{defect.stationId}</TableCell>
                    <TableCell>{defect.resolutionStatus}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        maxRows={3}
                        value={trackingRecords.find((record) => record.defectId === defect.defectId)?.note ?? draftNotes[defect.defectId] ?? ""}
                        placeholder="What did you notice?"
                        disabled={tracked}
                        onChange={(event) =>
                          setDraftNotes((current) => ({ ...current, [defect.defectId]: event.target.value }))
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 145 }}>
                      <Select
                        size="small"
                        fullWidth
                        value={trackingRecords.find((record) => record.defectId === defect.defectId)?.trackingStatus ?? draftStatuses[defect.defectId] ?? "New"}
                        disabled={tracked}
                        onChange={(event) =>
                          setDraftStatuses((current) => ({ ...current, [defect.defectId]: event.target.value as TrackingStatus }))
                        }
                      >
                        {(["New", "Investigating", "Action Required", "Closed"] as TrackingStatus[]).map((status) => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      {tracked ? (
                        <Chip size="small" label="Tracked" color="primary" variant="outlined" />
                      ) : (
                        <Button
                          size="small"
                          variant={aboveThreshold ? "contained" : "outlined"}
                          onClick={() => onTrackDefect(defect, draftNotes[defect.defectId] ?? "", draftStatuses[defect.defectId] ?? "New")}
                        >
                          Flag & Save
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {visibleRecords.length > 150 && (
          <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#8a94a3" }}>
            Showing the first 150 matching records. Narrow the search to review a specific defect.
          </Typography>
        )}

        {visibleRecords.length === 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: "#687385" }}>
            No defect records match this search.
          </Typography>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Record the engineer observation and tracking status while reviewing the chart, then use Flag &amp; Save. The chart itself is not stored as a tracking item.
        </Alert>

        <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Drawer>
  );
}

function DetailDialog({
  metric,
  result,
  definition,
  context,
  defects,
  onClose,
  tracked,
  onTrack,
  onReviewRecords,
}: {
  metric: OutlierMetric;
  result: OutlierResult;
  definition: MetricDefinition;
  context: Defect | null;
  defects: Defect[];
  onClose: () => void;
  tracked: boolean;
  onTrack: (note: string, trackingStatus: TrackingStatus) => void;
  onReviewRecords: () => void;
}) {
  const relatedDefects = useMemo(() => {
    if (metric === "daily-defects") {
      return defects.filter((defect) => defect.reportDate === result.id);
    }
    if (metric === "station-defects") {
      return defects.filter((defect) => defect.stationId === result.id);
    }
    if (metric === "vin-defects") {
      return defects.filter((defect) => defect.vin === result.id);
    }
    return context ? [context] : [];
  }, [context, defects, metric, result.id]);

  const severeCount = relatedDefects.filter((defect) => defect.severityRating <= 3).length;
  const openCount = relatedDefects.filter((defect) => defect.resolutionStatus !== "Resolved").length;
  const isRecordLevel = metric === "resolution-time" || metric === "rework-time";
  const [note, setNote] = useState("");
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("New");

  return (
    <Box>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          backgroundColor: "rgba(23, 32, 51, 0.38)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
        onClick={onClose}
      >
        <Card
          onClick={(event) => event.stopPropagation()}
          sx={{
            width: "min(760px, 100%)",
            maxHeight: "90vh",
            overflow: "auto",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 2 }}>
              <Box>
                <Typography variant="overline" sx={{ color: "#1f5eff", fontWeight: 800 }}>
                  Why this was flagged
                </Typography>
                <Typography variant="h5" sx={{ color: "#172033", fontWeight: 800 }}>
                  {getResultLabel(metric, result, defects)}
                </Typography>
              </Box>
              <Chip
                label={getDirectionLabel(result.direction)}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 800,
                  color: result.direction === "high" ? "#9b3f00" : "#315b79",
                  backgroundColor: result.direction === "high" ? "#fff1e8" : "#eef5fb",
                }}
              />
            </Box>

            <Alert severity="info" sx={{ mt: 2.5 }}>
              {result.explanation}
            </Alert>

            <div className="outlier-detail-grid">
              <DetailStat label="Observed" value={formatMetricValue(metric, result.value)} />
              <DetailStat label="Adaptive threshold" value={formatMetricValue(metric, result.threshold)} />
              <DetailStat label="Method" value={definition.methodTitle} />
              <DetailStat label="Related defect records" value={relatedDefects.length.toLocaleString()} />
              <DetailStat label="Severe ratings (1–3)" value={severeCount.toLocaleString()} />
              <DetailStat label="Not resolved" value={openCount.toLocaleString()} />
            </div>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#172033" }}>
              Plain-language interpretation
            </Typography>
            <Typography variant="body2" sx={{ color: "#5f6b7a", mt: 0.75, lineHeight: 1.75 }}>
              {isRecordLevel
                ? "This individual record is unusual under the selected rule. The flag focuses engineering review; it does not by itself establish a process cause, data error, or causal relationship."
                : "This chart observation is unusual under the selected rule. It is an analytical signal, not an individual defect tracking item. Review the underlying records and flag only the defects that require follow-up."}
            </Typography>

            {context && isRecordLevel && (
              <Box sx={{ mt: 2.25, p: 2, borderRadius: 2, backgroundColor: "#f7f9fb" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
                  Record context
                </Typography>
                <Typography variant="body2" sx={{ color: "#687385", mt: 0.75, lineHeight: 1.8 }}>
                  VIN: {context.vin} · Model: {context.carModel} · Station: {context.stationId} ({context.stationName}) · Category: {context.defectCategory} · Status: {context.resolutionStatus}
                </Typography>
              </Box>
            )}

            {isRecordLevel && !tracked && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, backgroundColor: "#f7f9fb" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
                  Engineer observation before flagging
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  label="What did you notice?"
                  placeholder="Capture the observation while it is fresh..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  sx={{ mt: 1.25 }}
                />
                <FormControl size="small" sx={{ mt: 1.25, minWidth: 190 }}>
                  <InputLabel>Tracking status</InputLabel>
                  <Select
                    value={trackingStatus}
                    label="Tracking status"
                    onChange={(event) => setTrackingStatus(event.target.value as TrackingStatus)}
                  >
                    {(["New", "Investigating", "Action Required", "Closed"] as TrackingStatus[]).map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.5, mt: 3 }}>
              {isRecordLevel ? (
                <Button variant={tracked ? "outlined" : "contained"} onClick={() => onTrack(note, trackingStatus)}>
                  {tracked ? "Tracked for follow-up" : "Flag & Save"}
                </Button>
              ) : (
                <Button variant="contained" onClick={onReviewRecords}>
                  Review underlying records
                </Button>
              )}
              <button className="outlier-close-button" onClick={onClose}>
                Close
              </button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <Box className="outlier-detail-stat">
      <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: "#172033", fontWeight: 800, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}
