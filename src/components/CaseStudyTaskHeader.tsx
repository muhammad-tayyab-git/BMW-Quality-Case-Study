import { Box, Chip, Typography } from "@mui/material";

interface CaseStudyTaskHeaderProps {
  task: string;
  title: string;
  description: string;
  howItWorks?: string;
}

/**
 * Keeps the dashboard explanation close to the workflow it describes.
 * The case asks for a production-quality UI for a quality engineer, so the
 * explanation is intentionally short and placed at the point of use rather
 * than hidden on a separate methodology page.
 */
export default function CaseStudyTaskHeader({
  task,
  title,
  description,
  howItWorks,
}: CaseStudyTaskHeaderProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Chip label={task} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
        <Typography variant="h5" component="h2" sx={{ fontWeight: 850, color: "#172033" }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mt: 0.75, color: "#687385", maxWidth: 920, lineHeight: 1.65 }}>
        {description}
      </Typography>
      {howItWorks && (
        <Box sx={{ mt: 1.25, px: 1.5, py: 1.15, borderRadius: 2, backgroundColor: "#f7f9fb", border: "1px solid #e1e5eb" }}>
          <Typography component="span" variant="caption" sx={{ fontWeight: 850, color: "#172033" }}>
            How it works: {" "}
          </Typography>
          <Typography component="span" variant="caption" sx={{ color: "#5f6b7a", lineHeight: 1.6 }}>
            {howItWorks}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
