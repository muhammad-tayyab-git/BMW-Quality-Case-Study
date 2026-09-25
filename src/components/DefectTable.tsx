import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";

import type { Defect } from "../types/defect";
import { useQualityTracking } from "../hooks/useQualityTracking";
import type { TrackingStatus } from "../types/qualityTracking";

interface DefectTableProps {
  defects: Defect[];
}

type SortKey =
  | "defectId"
  | "reportDate"
  | "vin"
  | "carModel"
  | "motorType"
  | "designPackage"
  | "stationName"
  | "defectName"
  | "severityRating"
  | "resolutionStatus"
  | "resolutionTimeHours";

type SortDirection = "asc" | "desc";

function getSeverityLabel(value: number) {
  if (value <= 3) return "High";
  if (value <= 6) return "Medium";
  return "Lower";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  return String(value);
}

export default function DefectTable({
  defects,
}: DefectTableProps) {
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("All");
  const [motorFilter, setMotorFilter] = useState("All");
  const [designFilter, setDesignFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [sortKey, setSortKey] =
    useState<SortKey>("reportDate");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [selectedDefect, setSelectedDefect] =
    useState<Defect | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<string, TrackingStatus>>({});

  const { records, flag, update, unflag } = useQualityTracking();

  const selectedTracking = selectedDefect
    ? records.find((record) => record.defectId === selectedDefect.defectId)
    : undefined;

  const filteredDefects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return defects.filter((defect) => {
      const searchableText = [
        defect.defectId,
        defect.reportDate,
        defect.reportTime,
        defect.productionDate,
        defect.vin,
        defect.carModel,
        defect.motorType,
        defect.designPackage,
        defect.stationId,
        defect.stationName,
        defect.partNumber,
        defect.partName,
        defect.supplier,
        defect.defectName,
        defect.defectCategory,
        defect.severityRating,
        defect.inspectorId,
        defect.productionShift,
        defect.resolutionStatus,
        defect.resolutionTimestamp,
        defect.resolutionTimeHours,
        defect.rootCauseIdentified,
        defect.reworkTimeMinutes,
      ]
        .map(formatValue)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        searchableText.includes(normalizedSearch);

      const matchesModel =
        modelFilter === "All" ||
        defect.carModel === modelFilter;

      const matchesMotor =
        motorFilter === "All" ||
        defect.motorType === motorFilter;

      const matchesDesign =
        designFilter === "All" ||
        defect.designPackage === designFilter;

      const matchesStatus =
        statusFilter === "All" ||
        defect.resolutionStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        defect.defectCategory === categoryFilter;

      return (
        matchesSearch &&
        matchesModel &&
        matchesMotor &&
        matchesDesign &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    defects,
    search,
    modelFilter,
    motorFilter,
    designFilter,
    statusFilter,
    categoryFilter,
  ]);

  const sortedDefects = useMemo(() => {
    return [...filteredDefects].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === null || aValue === undefined) {
        return 1;
      }

      if (bValue === null || bValue === undefined) {
        return -1;
      }

      const result =
        typeof aValue === "number" &&
        typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(
              String(bValue),
              undefined,
              { numeric: true },
            );

      return sortDirection === "asc" ? result : -result;
    });
  }, [
    filteredDefects,
    sortKey,
    sortDirection,
  ]);

  const visibleDefects = sortedDefects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    setPage(0);
  }

  function getDraftNote(defectId: string) {
    return draftNotes[defectId] ?? "";
  }

  function getDraftStatus(defectId: string): TrackingStatus {
    return draftStatuses[defectId] ?? "New";
  }

  function saveManualFlag(defect: Defect) {
    flag({
      targetKey: `manual:defect:${defect.defectId}`,
      source: "manual",
      metric: "manual-review",
      signalId: defect.defectId,
      signalLabel: `${defect.defectId} · ${defect.defectName}`,
      defectId: defect.defectId,
      observedValue: defect.severityRating,
      threshold: null,
      direction: null,
      note: getDraftNote(defect.defectId),
      trackingStatus: getDraftStatus(defect.defectId),
    });
    setDraftNotes((current) => {
      const next = { ...current };
      delete next[defect.defectId];
      return next;
    });
    setDraftStatuses((current) => {
      const next = { ...current };
      delete next[defect.defectId];
      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setModelFilter("All");
    setMotorFilter("All");
    setDesignFilter("All");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPage(0);
  }

  const filterValues = {
    models: Array.from(
      new Set(defects.map((defect) => defect.carModel)),
    ),
    motors: Array.from(
      new Set(defects.map((defect) => defect.motorType)),
    ),
    designs: Array.from(
      new Set(defects.map((defect) => defect.designPackage)),
    ),
    statuses: Array.from(
      new Set(defects.map((defect) => defect.resolutionStatus)),
    ),
    categories: Array.from(
      new Set(defects.map((defect) => defect.defectCategory)),
    ),
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e1e5eb",
          borderRadius: 2.5,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#172033",
            }}
          >
            Defect Data Explorer
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#687385",
              mt: 0.5,
              mb: 2.5,
            }}
          >
            Search, filter and sort the reported defect records.
            Write your observation and tracking status directly while inspecting; then flag the record in one action.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "minmax(240px, 2fr) repeat(5, minmax(130px, 1fr))",
              gap: 1.5,
              "@media (max-width: 1100px)": {
                gridTemplateColumns:
                  "repeat(3, minmax(160px, 1fr))",
              },
              "@media (max-width: 700px)": {
                gridTemplateColumns: "1fr",
              },
            }}
          >
            <TextField
              size="small"
              label="Search all fields"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              fullWidth
            />

            <FormControl size="small">
              <InputLabel>Model</InputLabel>
              <Select
                value={modelFilter}
                label="Model"
                onChange={(event) => {
                  setModelFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">All models</MenuItem>
                {filterValues.models.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Motor</InputLabel>
              <Select
                value={motorFilter}
                label="Motor"
                onChange={(event) => {
                  setMotorFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">All motors</MenuItem>
                {filterValues.motors.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Design</InputLabel>
              <Select
                value={designFilter}
                label="Design"
                onChange={(event) => {
                  setDesignFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">
                  All designs
                </MenuItem>
                {filterValues.designs.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">
                  All statuses
                </MenuItem>
                {filterValues.statuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="All">
                  All categories
                </MenuItem>
                {filterValues.categories.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#687385" }}
            >
              Showing {sortedDefects.length.toLocaleString()}{" "}
              matching records
            </Typography>

            <Button
              variant="text"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </Box>
        </Box>

        <TableContainer
          sx={{
            borderTop: "1px solid #e1e5eb",
            overflowX: "auto",
          }}
        >
          <Table
            size="small"
            sx={{ minWidth: 1720 }}
          >
            <TableHead>
              <TableRow>
                {[
                  ["defectId", "Defect ID"],
                  ["reportDate", "Report Date"],
                  ["vin", "VIN"],
                  ["carModel", "Model"],
                  ["motorType", "Motor"],
                  ["designPackage", "Design"],
                  ["stationName", "Station"],
                  ["defectName", "Defect"],
                  ["defectCategory", "Category"],
                  ["severityRating", "Severity"],
                  ["resolutionStatus", "Status"],
                  [
                    "resolutionTimeHours",
                    "Resolution (h)",
                  ],
                ].map(([key, label]) => (
                  <TableCell
                    key={key}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#f8fafc",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <TableSortLabel
                      active={sortKey === key}
                      direction={
                        sortKey === key
                          ? sortDirection
                          : "asc"
                      }
                      onClick={() =>
                        handleSort(key as SortKey)
                      }
                    >
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}

                <TableCell
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f8fafc",
                    minWidth: 290,
                  }}
                >
                  Engineer observation
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f8fafc",
                    minWidth: 150,
                  }}
                >
                  Tracking status
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f8fafc",
                  }}
                >
                  Quality tracking
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 700,
                    backgroundColor: "#f8fafc",
                  }}
                >
                  Details
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {visibleDefects.map((defect) => {
                const rowTracking = records.find((record) => record.defectId === defect.defectId);

                return (
                <TableRow
                  key={defect.defectId}
                  hover
                >
                  <TableCell>
                    {defect.defectId}
                  </TableCell>

                  <TableCell>
                    {defect.reportDate}
                  </TableCell>

                  <TableCell>
                    {defect.vin}
                  </TableCell>

                  <TableCell>
                    {defect.carModel}
                  </TableCell>

                  <TableCell>
                    {defect.motorType}
                  </TableCell>

                  <TableCell>
                    {defect.designPackage}
                  </TableCell>

                  <TableCell>
                    {defect.stationName}
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                    >
                      {defect.defectName}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {defect.defectCategory}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={`${defect.severityRating} · ${getSeverityLabel(
                        defect.severityRating,
                      )}`}
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={defect.resolutionStatus}
                    />
                  </TableCell>

                  <TableCell>
                    {defect.resolutionTimeHours === null
                      ? "—"
                      : `${defect.resolutionTimeHours.toFixed(
                          1,
                        )} h`}
                  </TableCell>

                  {rowTracking ? (
                    <TableCell sx={{ minWidth: 290 }}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        maxRows={3}
                        value={rowTracking.note}
                        placeholder="Add or update observation..."
                        onChange={(event) =>
                          update(rowTracking.trackingId, { note: event.target.value })
                        }
                      />
                    </TableCell>
                  ) : (
                    <TableCell sx={{ minWidth: 290 }}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        maxRows={3}
                        value={getDraftNote(defect.defectId)}
                        placeholder="What did you notice? Add it before flagging..."
                        onChange={(event) =>
                          setDraftNotes((current) => ({
                            ...current,
                            [defect.defectId]: event.target.value,
                          }))
                        }
                      />
                    </TableCell>
                  )}

                  <TableCell sx={{ minWidth: 150 }}>
                    <Select
                      size="small"
                      fullWidth
                      value={rowTracking?.trackingStatus ?? getDraftStatus(defect.defectId)}
                      onChange={(event) => {
                        const value = event.target.value as TrackingStatus;
                        if (rowTracking) {
                          update(rowTracking.trackingId, { trackingStatus: value });
                        } else {
                          setDraftStatuses((current) => ({ ...current, [defect.defectId]: value }));
                        }
                      }}
                    >
                      {(["New", "Investigating", "Action Required", "Closed"] as TrackingStatus[]).map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell>
                    {rowTracking ? (
                      <Chip
                        size="small"
                        label="Tracked"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => saveManualFlag(defect)}
                      >
                        Flag & Save
                      </Button>
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      onClick={() =>
                        setSelectedDefect(defect)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}

              {visibleDefects.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    No records match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sortedDefects.length}
          page={page}
          onPageChange={(_, newPage) =>
            setPage(newPage)
          }
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(
              Number(event.target.value),
            );
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      <Dialog
        open={selectedDefect !== null}
        onClose={() => setSelectedDefect(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700 }}
        >
          Defect Record Details
        </DialogTitle>

        <DialogContent dividers>
          {selectedDefect && (
            <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 2,
                "@media (max-width: 600px)": {
                  gridTemplateColumns: "1fr",
                },
              }}
            >
              {[
                ["Defect ID", selectedDefect.defectId],
                ["Report Date", selectedDefect.reportDate],
                ["Report Time", selectedDefect.reportTime],
                [
                  "Production Date",
                  selectedDefect.productionDate,
                ],
                ["VIN", selectedDefect.vin],
                ["Car Model", selectedDefect.carModel],
                ["Motor Type", selectedDefect.motorType],
                [
                  "Design Package",
                  selectedDefect.designPackage,
                ],
                ["Station ID", selectedDefect.stationId],
                [
                  "Station Name",
                  selectedDefect.stationName,
                ],
                [
                  "Original Station Name",
                  selectedDefect.stationNameOriginal,
                ],
                [
                  "Part Number",
                  selectedDefect.partNumber,
                ],
                ["Part Name", selectedDefect.partName],
                ["Supplier", selectedDefect.supplier],
                [
                  "Defect Name",
                  selectedDefect.defectName,
                ],
                [
                  "Defect Category",
                  selectedDefect.defectCategory,
                ],
                [
                  "Severity Rating",
                  selectedDefect.severityRating,
                ],
                [
                  "Inspector ID",
                  selectedDefect.inspectorId,
                ],
                [
                  "Production Shift",
                  selectedDefect.productionShift,
                ],
                [
                  "Resolution Status",
                  selectedDefect.resolutionStatus,
                ],
                [
                  "Resolution Timestamp",
                  selectedDefect.resolutionTimestamp,
                ],
                [
                  "Resolution Time (hours)",
                  selectedDefect.resolutionTimeHours,
                ],
                [
                  "Root Cause Identified",
                  selectedDefect.rootCauseIdentified,
                ],
                [
                  "Rework Time (minutes)",
                  selectedDefect.reworkTimeMinutes,
                ],
                [
                  "Potential Duplicate",
                  selectedDefect.potentialDuplicate
                    ? "Yes"
                    : "No",
                ],
              ].map(([label, value]) => (
                <Box key={String(label)}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#687385",
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.3,
                      color: "#172033",
                      wordBreak: "break-word",
                    }}
                  >
                    {formatValue(value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                border: "1px solid #d7e4ff",
                borderRadius: 2,
                backgroundColor: "#f5f8ff",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#172033" }}>
                Quality follow-up
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: "#687385", lineHeight: 1.7 }}>
                This tracking status is separate from the defect&apos;s Resolution Status. Use it for engineering investigation and follow-up.
              </Typography>

              {selectedTracking ? (
                <>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1.5, flexWrap: "wrap" }}>
                    <Chip size="small" label="Tracked" color="primary" variant="outlined" />
                    <Select
                      size="small"
                      value={selectedTracking.trackingStatus}
                      onChange={(event) =>
                        update(selectedTracking.trackingId, {
                          trackingStatus: event.target.value as TrackingStatus,
                        })
                      }
                    >
                      <MenuItem value="New">New</MenuItem>
                      <MenuItem value="Investigating">Investigating</MenuItem>
                      <MenuItem value="Action Required">Action Required</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                    </Select>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Investigation note"
                    value={selectedTracking.note}
                    onChange={(event) =>
                      update(selectedTracking.trackingId, { note: event.target.value })
                    }
                    multiline
                    minRows={3}
                    sx={{ mt: 1.5 }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                    <TextField
                      size="small"
                      label="Owner"
                      value={selectedTracking.owner}
                      onChange={(event) =>
                        update(selectedTracking.trackingId, { owner: event.target.value })
                      }
                    />
                    <Button
                      color="error"
                      onClick={() => {
                        unflag(selectedTracking.trackingId);
                        setSelectedDefect(null);
                      }}
                    >
                      Remove flag
                    </Button>
                  </Box>
                </>
              ) : (
                <Button
                  variant="contained"
                  sx={{ mt: 1.5 }}
                  onClick={() =>
                    flag({
                      targetKey: `manual:defect:${selectedDefect.defectId}`,
                      source: "manual",
                      metric: "manual-review",
                      signalId: selectedDefect.defectId,
                      signalLabel: `${selectedDefect.defectId} · ${selectedDefect.defectName}`,
                      defectId: selectedDefect.defectId,
                      observedValue: selectedDefect.severityRating,
                      threshold: null,
                      direction: null,
                    })
                  }
                >
                  Flag for quality follow-up
                </Button>
              )}
            </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}