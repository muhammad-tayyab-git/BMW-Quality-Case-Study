import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import type { Defect } from "../types/defect";
import type { QualityTrackingRecord } from "../types/qualityTracking";
import type { AIInvestigationResponse } from "../types/aiInvestigation";
import { buildAIInvestigationEvidence, verifyAIInvestigationResult } from "../utils/aiInvestigation";
import { generateAIInvestigationBrief } from "../services/aiInvestigationApi";

interface AIInvestigationBriefProps {
  defects: Defect[];
  trackingRecord: QualityTrackingRecord;
  trackingRecords: QualityTrackingRecord[];
}

export default function AIInvestigationBrief({
  defects,
  trackingRecord,
  trackingRecords,
}: AIInvestigationBriefProps) {
  const [response, setResponse] = useState<AIInvestigationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const verification = response
    ? verifyAIInvestigationResult(response.result, response.evidence.evidenceRows)
    : null;

  const evidence = useMemo(
    () => buildAIInvestigationEvidence(defects, trackingRecords, trackingRecord.trackingId),
    [defects, trackingRecords, trackingRecord.trackingId],
  );

  const flaggedRecords = evidence?.evidenceRows.filter(
    (row) => row.evidenceRole === "flagged",
  ) ?? [];

  async function generateBrief() {
    if (!evidence) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateAIInvestigationBrief(evidence);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AI investigation could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      elevation={0}
      sx={{
        mt: 2.5,
        border: "1px solid #b9a7e8",
        borderLeft: "5px solid #6b4bb5",
        borderRadius: 2.5,
        background: "linear-gradient(180deg, #fbf9ff 0%, #ffffff 100%)",
      }}
    >
      <CardContent sx={{ p: { xs: 1.75, sm: 2.5 } }}>
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box sx={{ p: 0.9, borderRadius: 1.5, backgroundColor: "#eee8fb", color: "#5d3da1" }}>
              <AutoAwesomeOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "#5d3da1", fontWeight: 850, letterSpacing: "0.1em" }}>
                Task 5 · AI investigation
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.1, fontWeight: 850, color: "#172033" }}>
                AI Root-Cause Investigation Brief
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: "#687385", lineHeight: 1.65 }}>
                The LLM reviews only the already-flagged records plus deterministic supporting evidence. It suggests investigation topics; it does not declare a root cause or change production data.
              </Typography>
            </Box>
          </Box>
        </Box>

        {!evidence ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            This AI step is available only after an individual defect has been flagged in Task 3. The selected tracking record is the primary evidence input.
          </Alert>
        ) : (
          <>
            <Box sx={{ mt: 2, p: 1.5, border: "1px solid #e1e5eb", borderRadius: 2, backgroundColor: "#ffffff" }}>
              <Typography variant="caption" sx={{ color: "#687385", fontWeight: 800 }}>
                Task 3 focus
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.35, color: "#343b47", lineHeight: 1.6 }}>
                {trackingRecord.defectId} · {trackingRecord.signalLabel} · status {trackingRecord.trackingStatus}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Chip size="small" label={`${flaggedRecords.length} flagged record${flaggedRecords.length === 1 ? "" : "s"}`} />
              <Chip size="small" label={`${evidence.evidenceRows.length} evidence rows`} />
              <Chip size="small" label={`Flagged ${trackingRecord.defectId}`} />
            </Box>

            <Box sx={{ mt: 1.75, p: 1.5, borderRadius: 2, backgroundColor: "#f4f0fb" }}>
              <Typography variant="caption" sx={{ color: "#5d3da1", fontWeight: 800 }}>
                AI boundary
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.35, color: "#4f5663", lineHeight: 1.6 }}>
                Our application selects the rows and calculates the filters. The LLM only interprets that bounded evidence. Every AI finding must point back to one or more visible defect IDs.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AutoAwesomeOutlinedIcon />}
              onClick={generateBrief}
              disabled={loading}
              sx={{ mt: 2, backgroundColor: "#5d3da1", "&:hover": { backgroundColor: "#4d3188" } }}
            >
              {loading ? "Generating investigation brief…" : response ? "Regenerate AI brief" : "Generate AI brief"}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            )}

            {response && (
              <Box sx={{ mt: 2.5 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 850, color: "#172033" }}>
                      Investigation brief
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#8a94a3" }}>
                      Generated by {response.model} · {new Date(response.generatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={verification?.valid ? <FactCheckOutlinedIcon /> : <WarningAmberOutlinedIcon />}
                    label={verification?.valid ? "Evidence references verified" : "Evidence check needs review"}
                    color={verification?.valid ? "success" : "warning"}
                    variant="outlined"
                    sx={{ fontWeight: 750 }}
                  />
                </Box>

                <Alert
                  severity={verification?.valid ? "success" : "warning"}
                  sx={{ mt: 1.5, borderRadius: 2 }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {verification?.valid
                      ? `Deterministic check passed: all ${verification.findingCount} AI findings cite defect IDs that exist in the supplied evidence rows. This verifies the source references, not causation; the engineer should still review the rows.`
                      : `The deterministic citation check found ${verification?.invalidEvidenceIds.length ?? 0} invalid evidence reference(s). Do not rely on those findings until the evidence is reviewed.`}
                  </Typography>
                </Alert>

                <FindingSection title="Observed patterns" items={response.result.observedPatterns} />
                <FindingSection title="Possible investigation topics" items={response.result.investigationTopics} />
                <FindingSection title="Recommended next checks" items={response.result.recommendedChecks} />

                <Box sx={{ mt: 2, border: "1px solid #e1e5eb", borderRadius: 2, overflow: "hidden" }}>
                  <Button
                    fullWidth
                    onClick={() => setShowEvidence((value) => !value)}
                    startIcon={<VisibilityOutlinedIcon />}
                    sx={{ justifyContent: "flex-start", px: 1.5, py: 1.2, color: "#172033", fontWeight: 800 }}
                  >
                    {showEvidence ? "Hide evidence and filters" : "Show evidence and filters"}
                  </Button>
                  <Collapse in={showEvidence}>
                    <Box sx={{ p: 1.5, borderTop: "1px solid #e1e5eb" }}>
                      <Typography variant="caption" sx={{ color: "#687385", fontWeight: 800 }}>
                        Deterministic filters used before the LLM
                      </Typography>
                      <Box component="ul" sx={{ mt: 0.75, mb: 1.5, pl: 2.5 }}>
                        {response.evidence.filters.map((filter) => (
                          <Typography key={filter} component="li" variant="caption" sx={{ color: "#5f6b7a", mb: 0.35 }}>
                            {filter}
                          </Typography>
                        ))}
                      </Box>

                      <TableContainer sx={{ maxHeight: 420 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800 }}>Defect ID</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Station</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Defect</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>Severity</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {response.evidence.evidenceRows.map((row) => (
                              <TableRow key={`${row.evidenceRole}:${row.defectId}`} hover>
                                <TableCell sx={{ fontWeight: 750 }}>{row.defectId}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={row.evidenceRole === "flagged" ? "Flagged" : row.evidenceRole === "vin-context" ? "VIN context" : "Related"}
                                    sx={{ fontSize: 11 }}
                                  />
                                </TableCell>
                                <TableCell>{row.stationId}</TableCell>
                                <TableCell>{row.defectName}</TableCell>
                                <TableCell align="right">{row.severityRating}</TableCell>
                                <TableCell>{row.resolutionStatus}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Collapse>
                </Box>

                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  AI output is an investigation aid, not proof of root cause. An engineer can inspect the cited rows and disagree with or reject every suggestion.
                </Alert>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FindingSection({
  title,
  items,
}: {
  title: string;
  items: { text: string; evidenceIds: string[] }[];
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 850, color: "#172033" }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ mt: 0.6, color: "#8a94a3" }}>
          No evidence-supported item was returned.
        </Typography>
      ) : (
        <Box sx={{ mt: 0.75, display: "grid", gap: 0.9 }}>
          {items.map((item, index) => (
            <Box key={`${item.text}-${index}`} sx={{ p: 1.25, border: "1px solid #e1e5eb", borderRadius: 1.75, backgroundColor: "#fff" }}>
              <Typography variant="body2" sx={{ color: "#343b47", lineHeight: 1.6 }}>
                {item.text}
              </Typography>
              <Box sx={{ mt: 0.8, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "#8a94a3", fontWeight: 700 }}>
                  Evidence:
                </Typography>
                {item.evidenceIds.map((id) => (
                  <Chip key={id} size="small" label={id} variant="outlined" sx={{ fontSize: 10.5 }} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
