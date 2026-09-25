import {
  Alert,
  AlertTitle,
  Typography,
} from "@mui/material";

export default function RateMethodologyCard() {
  return (
    <Alert
      severity="info"
      sx={{
        mt: 3,
        border: "1px solid #cfdcf5",
        backgroundColor: "#f7faff",
        borderRadius: 2.5,
      }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>
        Rate methodology
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 1 }}>
        The overall production-level rate uses the case-study
        production assumption of approximately 300 vehicles per
        day over 181 days, giving an estimated denominator of
        54,300 vehicles.
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        The 8,198 rows represent defect reports, not vehicles.
        Therefore 15.1 means approximately 15.1 defect reports
        per 100 estimated produced vehicles; it does not mean
        that 15.1% of vehicles were defective.
      </Typography>

      <Typography variant="body2">
        Model, motor and design-package production volumes were
        not supplied. Their charts therefore show defect reports,
        affected VINs and reports per affected vehicle rather
        than unsupported configuration-specific defect rates.
      </Typography>
    </Alert>
  );
}