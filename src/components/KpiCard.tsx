import {
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  formula?: string;
  details?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  formula,
  details,
}: KpiCardProps) {
  const tooltipContent = (
    <div>
      {details && (
        <div
          style={{
            marginBottom: formula ? "10px" : undefined,
          }}
        >
          {details}
        </div>
      )}

      {formula && (
        <div
          style={{
            whiteSpace: "pre-line",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {formula}
        </div>
      )}
    </div>
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e1e5eb",
        borderRadius: 2.5,
        backgroundColor: "#ffffff",
        transition:
          "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 8px 24px rgba(23, 32, 51, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#687385",
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            {title}
          </Typography>

          {(formula || details) && (
            <Tooltip
              title={tooltipContent}
              arrow
              placement="top"
            >
              <IconButton
                size="small"
                aria-label={`Information about ${title}`}
                sx={{
                  color: "#7890aa",
                  mt: -1,
                  mr: -1,
                  "&:hover": {
                    color: "#1f5eff",
                    backgroundColor:
                      "rgba(31, 94, 255, 0.06)",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <Typography
          variant="h4"
          sx={{
            color: "#172033",
            fontWeight: 750,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: "#8a94a3",
              mt: 1,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}