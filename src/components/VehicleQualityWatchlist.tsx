import { useMemo, useState } from "react";
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
  Typography,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

import type { Defect } from "../types/defect";
import type { TrackingStatus } from "../types/qualityTracking";
import type { VehicleQualitySummary } from "../types/vehicleWatchlist";
import { buildVehicleQualityWatchlist } from "../utils/vehicleQualityWatchlist";
import { useQualityTracking } from "../hooks/useQualityTracking";
import Task4Reflection from "./Task4Reflection";

const STATUS_OPTIONS: TrackingStatus[] = [
  "New",
  "Investigating",
  "Action Required",
  "Closed",
];

type SortKey =
  | "defectCount"
  | "severityBurden"
  | "mostSevereRating"
  | "openCount"
  | "detectorFlaggedCount";

interface VehicleQualityWatchlistProps {
  defects: Defect[];
}

function severityLabel(rating: number) {
  if (rating <= 3) return "High severity";
  if (rating <= 6) return "Moderate severity";
  return "Lower severity";
}

function severityTone(rating: number) {
  if (rating <= 3) return { color: "#9b3f00", background: "#fff1e8" };
  if (rating <= 6) return { color: "#315b79", background: "#edf4f8" };
  return { color: "#5d6878", background: "#f1f3f6" };
}

function sortVehicles(items: VehicleQualitySummary[], sortKey: SortKey) {
  return [...items].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (sortKey === "mostSevereRating") return aValue - bValue;
    return bValue - aValue;
  });
}

export default function VehicleQualityWatchlist({ defects }: VehicleQualityWatchlistProps) {
  const vehicles = useMemo(() => buildVehicleQualityWatchlist(defects), [defects]);
  const { flag, getByDefectId } = useQualityTracking();

  const [search, setSearch] = useState("");
  const [minimumReports, setMinimumReports] = useState("2");
  const [sortKey, setSortKey] = useState<SortKey>("severityBurden");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<VehicleQualitySummary | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState("");
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("New");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minimum = Number(minimumReports);

    const matching = vehicles.filter((vehicle) => {
      const text = [
        vehicle.vin,
        ...vehicle.defects.map((defect) => defect.defectId),
        ...vehicle.defects.map((defect) => defect.defectName),
        ...vehicle.defects.map((defect) => defect.stationName),
      ]
        .join(" ")
        .toLowerCase();

      return vehicle.defectCount >= minimum && (!query || text.includes(query));
    });

    return sortVehicles(matching, sortKey);
  }, [minimumReports, search, sortKey, vehicles]);

  const visible = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const watchlistStats = useMemo(() => {
    const totalReports = vehicles.reduce((sum, vehicle) => sum + vehicle.defectCount, 0);
    const severeVehicles = vehicles.filter((vehicle) => vehicle.mostSevereRating <= 3).length;
    const openVehicles = vehicles.filter((vehicle) => vehicle.openCount > 0).length;
    const duplicateVehicles = vehicles.filter((vehicle) => vehicle.potentialDuplicateCount > 0).length;

    return { totalReports, severeVehicles, openVehicles, duplicateVehicles };
  }, [vehicles]);

  function openVehicle(vehicle: VehicleQualitySummary) {
    setSelected(vehicle);
    setSelectedDefect(null);
    setNote("");
    setOwner("");
    setTrackingStatus("New");
  }

  function openDefectForFlagging(defect: Defect) {
    setSelectedDefect(defect);
    const existing = getByDefectId(defect.defectId);
    setNote(existing?.note ?? "");
    setOwner(existing?.owner ?? "");
    setTrackingStatus(existing?.trackingStatus ?? "New");
  }

  function flagSelectedDefect() {
    if (!selectedDefect) return;

    flag({
      targetKey: `manual:${selectedDefect.defectId}`,
      source: "manual",
      metric: "manual",
      signalId: selectedDefect.defectId,
      signalLabel: `Vehicle watchlist · ${selectedDefect.defectName}`,
      defectId: selectedDefect.defectId,
      observedValue: selectedDefect.severityRating,
      threshold: null,
      direction: null,
      note,
      trackingStatus,
      owner,
    });

    setSelectedDefect(null);
  }

  return (
    <section className="vehicle-watchlist-section">
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="overline"
          sx={{ color: "#1f5eff", fontWeight: 800, letterSpacing: "0.1em" }}
        >
          Task 4 · Vehicle quality watchlist
        </Typography>
        <Typography variant="h5" component="h2" sx={{ mt: 0.25, fontWeight: 800, color: "#172033" }}>
          Find vehicles that deserve quality review
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: "#687385", maxWidth: 950, lineHeight: 1.7 }}>
          This view complements Task 2 by looking across defects at vehicle level. It surfaces VINs with multiple retained defect reports and shows the evidence behind each review candidate. It does not classify a vehicle as defective and does not automatically create tracking records.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <strong>Why this exists:</strong> an individual defect can be normal while several defects on the same vehicle may still deserve engineering attention. The watchlist makes that combined evidence visible before an engineer decides which individual defect to track.
      </Alert>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 1.5, mb: 2.5, "@media (max-width: 1100px)": { gridTemplateColumns: "repeat(3, 1fr)" }, "@media (max-width: 700px)": { gridTemplateColumns: "1fr 1fr" } }}>
        <WatchlistKpi label="Watchlist vehicles" value={vehicles.length} />
        <WatchlistKpi label="Retained reports" value={watchlistStats.totalReports} />
        <WatchlistKpi label="Open vehicles" value={watchlistStats.openVehicles} />
        <WatchlistKpi label="Severe vehicles" value={watchlistStats.severeVehicles} />
        <WatchlistKpi label="Duplicate candidates" value={watchlistStats.duplicateVehicles} />
      </Box>

      <Card elevation={0} sx={{ border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.25, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}>
            <TextField
              size="small"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder="Search VIN, defect or station"
              sx={{ minWidth: { md: 360 } }}
              slotProps={{ input: { startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: "#8a94a3" }} fontSize="small" /> } }}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
              <FormControl size="small" sx={{ minWidth: 165 }}>
                <InputLabel>Minimum reports</InputLabel>
                <Select
                  value={minimumReports}
                  label="Minimum reports"
                  onChange={(event) => { setMinimumReports(event.target.value); setPage(0); }}
                >
                  <MenuItem value="2">2+ reports</MenuItem>
                  <MenuItem value="3">3+ reports</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 205 }}>
                <InputLabel>Sort priority</InputLabel>
                <Select
                  value={sortKey}
                  label="Sort priority"
                  onChange={(event) => { setSortKey(event.target.value as SortKey); setPage(0); }}
                >
                  <MenuItem value="severityBurden">Severity burden</MenuItem>
                  <MenuItem value="defectCount">Defect count</MenuItem>
                  <MenuItem value="mostSevereRating">Most severe first</MenuItem>
                  <MenuItem value="openCount">Open defects</MenuItem>
                  <MenuItem value="detectorFlaggedCount">Detector signals</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>

        <TableContainer>
          <Table size="small" sx={{ minWidth: 1120 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f7f9fb" }}>
                <TableCell sx={{ fontWeight: 800 }}>Vehicle</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Reports</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Open</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>In progress</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Detector signals</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Stations</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Duplicate evidence</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((vehicle) => {
                const tone = severityTone(vehicle.mostSevereRating);
                return (
                  <TableRow key={vehicle.vin} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#172033" }}>{vehicle.vin}</Typography>
                      <Typography variant="caption" sx={{ color: "#8a94a3" }}>
                        {vehicle.defects[0]?.carModel} · {vehicle.defects[0]?.motorType}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{vehicle.defectCount}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`Avg ${vehicle.averageSeverity.toFixed(1)} · min ${vehicle.mostSevereRating}`}
                        sx={{ color: tone.color, backgroundColor: tone.background, fontWeight: 700 }}
                      />
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#8a94a3" }}>
                        {severityLabel(vehicle.mostSevereRating)} · burden {vehicle.severityBurden}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{vehicle.openCount}</TableCell>
                    <TableCell align="right">{vehicle.inProgressCount}</TableCell>
                    <TableCell align="right">{vehicle.detectorFlaggedCount}</TableCell>
                    <TableCell align="right">{vehicle.stationsInvolved}</TableCell>
                    <TableCell>
                      {vehicle.potentialDuplicateCount > 0 ? (
                        <Box>
                          <Chip size="small" label={`${vehicle.potentialDuplicateCount} candidate record${vehicle.potentialDuplicateCount === 1 ? "" : "s"}`} />
                          {vehicle.highConfidenceDuplicateCount > 0 && (
                            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#8a94a3" }}>
                              {vehicle.highConfidenceDuplicateCount} close-time candidate{vehicle.highConfidenceDuplicateCount === 1 ? "" : "s"}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#8a94a3" }}>None identified</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openVehicle(vehicle)} startIcon={<DirectionsCarOutlinedIcon />}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: "#172033" }}>No vehicles match the current filters</Typography>
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
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#8a94a3", lineHeight: 1.6 }}>
        Watchlist scope: retained defect records with at least 2 reports per VIN. Severity 1 is most severe. Duplicate candidates are retained and disclosed; they are not automatically removed or collapsed.
      </Typography>

      <Task4Reflection />

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <Box sx={{ width: { xs: "100vw", sm: 620 }, p: { xs: 2, sm: 3 } }}>
            <Typography variant="overline" sx={{ color: "#1f5eff", fontWeight: 800 }}>Vehicle quality review</Typography>
            <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 850, color: "#172033" }}>{selected.vin}</Typography>
            <Typography variant="body2" sx={{ color: "#687385", mt: 0.5 }}>
              {selected.defectCount} retained reports · {selected.stationsInvolved} station{selected.stationsInvolved === 1 ? "" : "s"} · severity burden {selected.severityBurden}
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
              <ReviewStat label="Average severity" value={selected.averageSeverity.toFixed(1)} />
              <ReviewStat label="Most severe rating" value={selected.mostSevereRating.toString()} />
              <ReviewStat label="Open" value={selected.openCount.toString()} />
              <ReviewStat label="In progress" value={selected.inProgressCount.toString()} />
              <ReviewStat label="Detector signals" value={selected.detectorFlaggedCount.toString()} />
              <ReviewStat label="Duplicate candidates" value={selected.potentialDuplicateCount.toString()} />
            </Box>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#172033" }}>Underlying defect records</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#687385" }}>
              Review the evidence before deciding whether an individual defect needs Task 3 follow-up.
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              {selected.defects.map((defect) => {
                const tracked = Boolean(getByDefectId(defect.defectId));
                return (
                  <Card key={defect.defectId} elevation={0} sx={{ mb: 1.25, border: "1px solid #e1e5eb", borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.75 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "#172033" }}>{defect.defectId}</Typography>
                          <Typography variant="body2" sx={{ mt: 0.25, color: "#5f6b7a" }}>{defect.defectName}</Typography>
                          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#8a94a3" }}>
                            {defect.stationId} · {defect.stationName} · Severity {defect.severityRating} · {defect.resolutionStatus}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant={tracked ? "outlined" : "contained"}
                          startIcon={<FlagOutlinedIcon />}
                          onClick={() => openDefectForFlagging(defect)}
                        >
                          {tracked ? "Review tracking" : "Flag & Save"}
                        </Button>
                      </Box>
                      {defect.potentialDuplicate && (
                        <Chip size="small" label="Potential duplicate candidate" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              A watchlist candidate is not a quality verdict. Select an individual defect before adding it to the existing Task 3 tracking queue.
            </Alert>
          </Box>
        )}
      </Drawer>

      <Drawer anchor="right" open={Boolean(selectedDefect)} onClose={() => setSelectedDefect(null)}>
        {selectedDefect && (
          <Box sx={{ width: { xs: "100vw", sm: 520 }, p: { xs: 2, sm: 3 } }}>
            <Typography variant="overline" sx={{ color: "#1f5eff", fontWeight: 800 }}>Task 3 · Individual defect tracking</Typography>
            <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 850, color: "#172033" }}>{selectedDefect.defectId}</Typography>
            <Typography variant="body2" sx={{ color: "#687385", mt: 0.5 }}>
              {selectedDefect.defectName} · VIN {selectedDefect.vin}
            </Typography>

            <Box sx={{ mt: 2, p: 2, backgroundColor: "#f7f9fb", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: "#5f6b7a", lineHeight: 1.8 }}>
                Station: {selectedDefect.stationId} ({selectedDefect.stationName})<br />
                Severity: {selectedDefect.severityRating} · Resolution: {selectedDefect.resolutionStatus}<br />
                Reported: {selectedDefect.reportDate} {selectedDefect.reportTime}
              </Typography>
            </Box>

            <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
              <InputLabel>Tracking status</InputLabel>
              <Select value={trackingStatus} label="Tracking status" onChange={(event) => setTrackingStatus(event.target.value as TrackingStatus)}>
                {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Owner" value={owner} onChange={(event) => setOwner(event.target.value)} sx={{ mt: 2 }} />
            <TextField fullWidth multiline minRows={5} label="Engineer observation" value={note} onChange={(event) => setNote(event.target.value)} sx={{ mt: 2 }} placeholder="What did you check? What action is needed?" />

            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2.5 }}>
              <Button onClick={() => setSelectedDefect(null)}>Cancel</Button>
              <Button variant="contained" onClick={flagSelectedDefect} startIcon={<FlagOutlinedIcon />}>Flag & Save</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </section>
  );
}

function WatchlistKpi({ label, value }: { label: string; value: number }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
      <CardContent sx={{ p: 1.75 }}>
        <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>{label}</Typography>
        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 850, color: "#172033" }}>{value.toLocaleString()}</Typography>
      </CardContent>
    </Card>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.25, border: "1px solid #e1e5eb", borderRadius: 1.5, backgroundColor: "#f7f9fb" }}>
      <Typography variant="caption" sx={{ color: "#687385", fontWeight: 700 }}>{label}</Typography>
      <Typography variant="subtitle1" sx={{ mt: 0.25, fontWeight: 800, color: "#172033" }}>{value}</Typography>
    </Box>
  );
}
