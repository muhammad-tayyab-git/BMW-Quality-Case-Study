import { useMemo, useState } from "react";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AIInvestigationBrief from "./AIInvestigationBrief";

// Task 5 is intentionally rendered inside the existing Task 3 investigation
// drawer so the AI acts on a human-selected defect rather than becoming a
// separate chatbot or a second anomaly detector.
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

import type { Defect } from "../types/defect";
import type {
  QualityTrackingRecord,
  TrackingStatus,
} from "../types/qualityTracking";
import { useQualityTracking } from "../hooks/useQualityTracking";

const STATUS_OPTIONS: TrackingStatus[] = [
  "New",
  "Investigating",
  "Action Required",
  "Closed",
];

interface QualityWorkflowProps {
  defects: Defect[];
}

function formatValue(value: number | null, metric: string) {
  if (value === null) return "—";
  if (metric === "resolution-time") return `${value.toFixed(2)} h`;
  if (metric === "rework-time") return `${value.toFixed(0)} min`;
  return value.toLocaleString();
}

function sourceLabel(source: QualityTrackingRecord["source"]) {
  if (source === "detector+manual") return "Detector + engineer";
  return source === "detector" ? "Task 2 detector" : "Engineer flag";
}

function statusColor(status: TrackingStatus) {
  if (status === "Action Required") return "#9b3f00";
  if (status === "Investigating") return "#315b79";
  if (status === "Closed") return "#3b6b4a";
  return "#5d6878";
}

export default function QualityWorkflow({ defects }: QualityWorkflowProps) {
  const { records, update, unflag, counts } = useQualityTracking();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrackingStatus | "All">("All");
  const [sourceFilter, setSourceFilter] = useState<QualityTrackingRecord["source"] | "All">("All");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<QualityTrackingRecord | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .filter((record) => {
        const defect = record.defectId
          ? defects.find((item) => item.defectId === record.defectId)
          : undefined;

        const text = [
          record.signalLabel,
          record.signalId,
          record.metric,
          record.note,
          record.owner,
          sourceLabel(record.source),
          record.trackingStatus,
          defect?.defectId,
          defect?.defectName,
          defect?.vin,
          defect?.stationName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          (!query || text.includes(query)) &&
          (statusFilter === "All" || record.trackingStatus === statusFilter) &&
          (sourceFilter === "All" || record.source === sourceFilter)
        );
      })
      .sort((a, b) => {
        const comparison = a.updatedAt.localeCompare(b.updatedAt);
        return sortNewestFirst ? -comparison : comparison;
      });
  }, [defects, records, search, sourceFilter, statusFilter, sortNewestFirst]);

  const visible = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const trackedDefects = new Set(
    records
      .filter((record) => record.defectId)
      .map((record) => record.defectId as string),
  );

  return (
    <section>
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="overline"
          sx={{ color: "#1f5eff", fontWeight: 800, letterSpacing: "0.1em" }}
        >
          Task 3 · Interactive quality workflow
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          sx={{ mt: 0.25, fontWeight: 800, color: "#172033" }}
        >
          Track the signals that need engineering attention
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 0.75, color: "#687385", maxWidth: 900 }}
        >
          Task 2 signals and engineer-selected records share one follow-up queue.
          During inspection, the engineer can capture an observation and tracking status at the moment the defect is flagged; the queue then supports later ownership and follow-up.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 1.5,
          mb: 2.5,
          "@media (max-width: 1100px)": { gridTemplateColumns: "repeat(3, 1fr)" },
          "@media (max-width: 700px)": { gridTemplateColumns: "1fr 1fr" },
        }}
      >
        <WorkflowKpi label="Flagged" value={records.length} />
        <WorkflowKpi label="New" value={counts.New} />
        <WorkflowKpi label="Investigating" value={counts.Investigating} />
        <WorkflowKpi label="Action required" value={counts["Action Required"]} />
        <WorkflowKpi label="Closed" value={counts.Closed} />
      </Box>

      <Card elevation={0} sx={{ border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.25,
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search signal, defect, VIN, owner or note"
              sx={{ maxWidth: { md: 430 } }}
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.25,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => {
                    setStatusFilter(event.target.value as TrackingStatus | "All");
                    setPage(0);
                  }}
                >
                  <MenuItem value="All">All statuses</MenuItem>
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Source"
                  onChange={(event) => {
                    setSourceFilter(event.target.value as QualityTrackingRecord["source"] | "All");
                    setPage(0);
                  }}
                >
                  <MenuItem value="All">All sources</MenuItem>
                  <MenuItem value="detector">Task 2 detector</MenuItem>
                  <MenuItem value="manual">Engineer flag</MenuItem>
                  <MenuItem value="detector+manual">Detector + engineer</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setSortNewestFirst((current) => !current)}
              >
                {sortNewestFirst ? "Newest first" : "Oldest first"}
              </Button>

            </Box>
          </Box>
        </CardContent>

        <TableContainer>
          <Table size="small" sx={{ minWidth: 1050 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f7f9fb" }}>
                <TableCell sx={{ fontWeight: 800 }}>Signal / record</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Evidence</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 230 }}>Engineer observation</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Owner</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Open</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((record) => {
                const defect = record.defectId
                  ? defects.find((item) => item.defectId === record.defectId)
                  : undefined;

                return (
                  <TableRow key={record.trackingId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#172033" }}>
                        {record.signalLabel}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#687385" }}>
                        {record.defectId}
                      </Typography>
                      {defect && (
                        <Typography variant="caption" sx={{ display: "block", color: "#8a94a3" }}>
                          {defect.vin} · {defect.stationId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatValue(record.observedValue, record.metric)}
                      {record.threshold !== null && (
                        <Typography variant="caption" sx={{ display: "block", color: "#8a94a3" }}>
                          threshold {formatValue(record.threshold, record.metric)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={sourceLabel(record.source)} />
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={record.trackingStatus}
                        onChange={(event) =>
                          update(record.trackingId, {
                            trackingStatus: event.target.value as TrackingStatus,
                          })
                        }
                        sx={{
                          minWidth: 145,
                          fontWeight: 700,
                          color: statusColor(record.trackingStatus),
                        }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        maxRows={3}
                        value={record.note}
                        placeholder="Add investigation note..."
                        onChange={(event) =>
                          update(record.trackingId, { note: event.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={record.owner}
                        placeholder="Owner"
                        onChange={(event) =>
                          update(record.trackingId, { owner: event.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Tooltip title="Open investigation">
                          <IconButton size="small" onClick={() => setSelected(record)}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from tracking queue">
                          <IconButton size="small" onClick={() => unflag(record.trackingId)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: "#172033" }}>
                      No tracked quality signals
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#687385", mt: 0.5 }}>
                      Flag a Task 2 signal or select a defect manually from Data Explorer.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#8a94a3" }}>
        {trackedDefects.size.toLocaleString()} individual defects are currently represented in the tracking queue.
        Chart selections are used to find the relevant defect records; only individual defects are stored as tracking items.
      </Typography>

      <InvestigationDrawer
        record={selected}
        defects={defects}
        onClose={() => setSelected(null)}
        onUpdate={update}
        onUnflag={unflag}
        trackingRecords={records}
      />
    </section>
  );
}

function WorkflowKpi({ label, value }: { label: string; value: number }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
      <CardContent sx={{ p: 1.75 }}>
        <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 850, color: "#172033" }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

function InvestigationDrawer({
  record,
  defects,
  onClose,
  onUpdate,
  onUnflag,
  trackingRecords,
}: {
  record: QualityTrackingRecord | null;
  defects: Defect[];
  onClose: () => void;
  onUpdate: QualityWorkflowUpdate;
  onUnflag: (trackingId: string) => void;
  trackingRecords: QualityTrackingRecord[];
}) {
  const defect = record?.defectId
    ? defects.find((item) => item.defectId === record.defectId)
    : undefined;

  return (
    <Drawer anchor="right" open={Boolean(record)} onClose={onClose}>
      {record && (
        <Box sx={{ width: { xs: "100vw", sm: 520 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="overline" sx={{ color: "#1f5eff", fontWeight: 800 }}>
            Quality investigation
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 850, color: "#172033" }}>
            {record.signalLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: "#687385", mt: 0.5 }}>
            {sourceLabel(record.source)} · individual defect record
          </Typography>

          <Box sx={{ mt: 2.5, p: 2, backgroundColor: "#f7f9fb", borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
              Detection evidence
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#5f6b7a", lineHeight: 1.7 }}>
              Observed: {formatValue(record.observedValue, record.metric)}
              {record.threshold !== null && ` · Adaptive threshold: ${formatValue(record.threshold, record.metric)}`}
            </Typography>
          </Box>

          {defect && (
            <Box sx={{ mt: 2, p: 2, border: "1px solid #e1e5eb", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
                Record context
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: "#687385", lineHeight: 1.8 }}>
                {defect.defectId} · VIN {defect.vin}<br />
                {defect.carModel} · {defect.stationId} ({defect.stationName})<br />
                {defect.defectName} · {defect.defectCategory}<br />
                Resolution: {defect.resolutionStatus}
              </Typography>
            </Box>
          )}

          {defect && (
            <AIInvestigationBrief
              defects={defects}
              trackingRecord={record}
              trackingRecords={trackingRecords}
            />
          )}

          <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
            <InputLabel>Tracking status</InputLabel>
            <Select
              value={record.trackingStatus}
              label="Tracking status"
              onChange={(event) =>
                onUpdate(record.trackingId, {
                  trackingStatus: event.target.value as TrackingStatus,
                })
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Owner"
            value={record.owner}
            onChange={(event) => onUpdate(record.trackingId, { owner: event.target.value })}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Investigation note"
            value={record.note}
            onChange={(event) => onUpdate(record.trackingId, { note: event.target.value })}
            sx={{ mt: 2 }}
            placeholder="What did you check? What action is needed? What evidence would change your conclusion?"
          />

          <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", mt: 2.5 }}>
            <Button color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => { onUnflag(record.trackingId); onClose(); }}>
              Remove flag
            </Button>
            <Button variant="contained" onClick={onClose}>Done</Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

type QualityWorkflowUpdate = (
  trackingId: string,
  changes: Partial<Pick<QualityTrackingRecord, "trackingStatus" | "owner" | "note">>,
) => void;
