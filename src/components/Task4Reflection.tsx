import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

export default function Task4Reflection() {
  return (
    <Card elevation={0} sx={{ mt: 3, border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          variant="overline"
          sx={{ color: "#1f5eff", fontWeight: 800, letterSpacing: "0.1em" }}
        >
          Task 4 · Reflection & Innovation
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 800, color: "#172033" }}>
          Why the Vehicle Quality Watchlist was added
        </Typography>

        <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip size="small" label="Vehicle-level review" />
          <Chip size="small" label="No automatic deduplication" />
          <Chip size="small" label="Human review before tracking" />
        </Box>

        <Typography variant="body2" sx={{ mt: 2, color: "#5f6b7a", lineHeight: 1.85 }}>
          The dashboard is based on a raw defect export rather than complete production records. The data contains reported defects only, several defects can share a VIN, and vehicles with no defects are absent from the extract. Therefore, some conclusions depend on assumptions about the available denominator and cannot be treated as complete production-quality rates.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, color: "#5f6b7a", lineHeight: 1.85 }}>
          One limitation of the Task 2 outlier approach is that it evaluates individual analytical signals. A vehicle with several moderate defects may not contain any single record that is an outlier, even though the combination of defects deserves engineering attention. To address this limitation, I implemented a Vehicle Quality Watchlist that groups retained defect records by VIN and highlights vehicles with multiple reports, severity evidence, unresolved defects, detector flags and station involvement.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, color: "#5f6b7a", lineHeight: 1.85 }}>
          I did not build a predictive quality model because the extract does not provide sufficient production-level outcomes, complete production counts, or validated labels for predicting future vehicle quality. I also did not automatically remove suspected duplicate records. Fifty candidate records were identified using matching vehicle, production, station, part and defect information, with a smaller subset having close reporting times. These records were retained because the available fields cannot prove that they represent duplicate physical defects.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, color: "#5f6b7a", lineHeight: 1.85 }}>
          The assumption I am least confident about is the approximately 300 units-per-day production volume supplied for the case. If this assumption is inaccurate, denominator-based KPIs such as the estimated vehicle defect rate will change, although the underlying defect records do not.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, color: "#5f6b7a", lineHeight: 1.85 }}>
          The dashboard number I would not yet defend to a plant manager is the estimated vehicle defect rate. To defend it, I would need actual production counts for the same period, ideally broken down by day and vehicle configuration.
        </Typography>

        <Box sx={{ mt: 2.5, p: 2, backgroundColor: "#f7f9fb", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
            Design decision
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#5f6b7a", lineHeight: 1.7 }}>
            The watchlist is a review aid, not a vehicle-quality verdict. Severity is shown explicitly because 1 is the most severe rating. Suspected duplicates are retained and disclosed rather than silently removed. An engineer must select an individual defect before it enters the existing Task 3 tracking workflow.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
