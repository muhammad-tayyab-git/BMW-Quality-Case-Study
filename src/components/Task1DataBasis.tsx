import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import type { Defect } from "../types/defect";

interface Task1DataBasisProps {
  defects: Defect[];
}

/**
 * The case explicitly asks us to treat data quality as part of the problem
 * and document cleaning/exclusions. This compact panel puts only the facts
 * that affect interpretation next to the Task 1 results.
 */
export default function Task1DataBasis({ defects }: Task1DataBasisProps) {
  const uniqueVins = new Set(defects.map((defect) => defect.vin)).size;
  const vinCounts = new Map<string, number>();
  for (const defect of defects) {
    vinCounts.set(defect.vin, (vinCounts.get(defect.vin) ?? 0) + 1);
  }
  const multiReportCount = Array.from(vinCounts.values()).filter((count) => count >= 2).length;
  const potentialDuplicates = defects.filter((defect) => defect.potentialDuplicate).length;

  return (
    <Card elevation={0} sx={{ mt: 2.5, border: "1px solid #e1e5eb", borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 1.75, md: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "#687385", fontWeight: 800, letterSpacing: "0.08em" }}>
              Data basis
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.15, fontWeight: 800, color: "#172033" }}>
              What the numbers represent
            </Typography>
          </Box>
          <Chip label="181 days · Jan 01–Jun 30, 2026" size="small" variant="outlined" />
        </Box>

        <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.5, "@media (max-width: 900px)": { gridTemplateColumns: "1fr" } }}>
          <Fact title="Data grain" text={`${defects.length.toLocaleString()} rows = reported defect records. ${uniqueVins.toLocaleString()} unique VINs. A VIN can have multiple rows.`} />
          <Fact title="Vehicle counting" text={`${multiReportCount.toLocaleString()} VINs have 2+ reports. They are counted once as vehicles and once per row as defect reports.`} />
          <Fact title="Cleaning & duplicates" text={`${potentialDuplicates.toLocaleString()} potential duplicate candidates were retained and marked; station names were normalized by Station ID while preserving the original value.`} />
        </Box>
      </CardContent>
    </Card>
  );
}

function Fact({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ p: 1.5, border: "1px solid #edf0f4", borderRadius: 2, backgroundColor: "#fafbfc" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>{title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "#5f6b7a", lineHeight: 1.65 }}>{text}</Typography>
    </Box>
  );
}
