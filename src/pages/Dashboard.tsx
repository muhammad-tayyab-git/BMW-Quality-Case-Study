import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { loadDefects } from "../data/loadDefects";
import type { Defect } from "../types/defect";

import QualityOverview from "../components/QualityOverview";
import ConfigurationAnalysis from "../components/ConfigurationAnalysis";
import DefectAnalysis from "../components/DefectAnalysis";
import StationAnalysis from "../components/StationAnalysis";

import DefectTable from "../components/DefectTable";
import RateMethodologyCard from "../components/RateMethodologyCard";
import Task1DataBasis from "../components/Task1DataBasis";
import CaseStudyTaskHeader from "../components/CaseStudyTaskHeader";

import OutlierDetection from "../components/OutlierDetection";
import QualityWorkflow from "../components/QualityWorkflow";
import VehicleQualityWatchlist from "../components/VehicleQualityWatchlist";
import QualityTrackingProvider from "../hooks/QualityTrackingProvider";

export default function Dashboard() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function fetchDefects() {
      try {
        const data = await loadDefects();

        setDefects(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDefects();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container
        sx={{
          py: 8,
          textAlign: "center",
        }}
      >
        <CircularProgress />

        <Typography sx={{ mt: 2 }}>
          Loading production quality data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <QualityTrackingProvider>
    <>
      {/* HEADER */}

      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="dashboard-brand-mark">QL</div>

            <div>
              <div className="dashboard-brand-title">
                BMW Quality Intelligence
              </div>

              <div className="dashboard-brand-subtitle">
                iX0 Production Quality Analytics
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="dashboard-main">
        {/* PAGE HEADING */}

        <div className="dashboard-page-heading">
          <div>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 750,
                color: "#172033",
                letterSpacing: "-0.03em",
              }}
            >
              Production Quality Dashboard
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 0.75,
                color: "#687385",
              }}
            >
              Defect patterns, production quality and resolution performance.
            </Typography>
          </div>

          <div className="dashboard-period">
            Production period · Jan 01 – Jun 30, 2026
          </div>
        </div>

        {/* TABS */}

        <Box
          sx={{
            mb: 4,
            borderBottom: "1px solid #dfe4ea",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,

              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                color: "#687385",
                minHeight: 48,
              },

              "& .Mui-selected": {
                color: "#1769aa",
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Data Explorer" />
            <Tab label="Outlier Detection" />
            <Tab label="Quality Workflow" />
            <Tab label="Vehicle Watchlist" />
          </Tabs>
        </Box>

        {/* TASK 1 · OVERVIEW */}

        {activeTab === 0 && (
          <>
            <CaseStudyTaskHeader
              task="Task 1"
              title="Production Quality"
              description="Make the raw defect extract transparent: show the current quality picture, explain the denominator used for overall rates, and let engineers inspect the underlying records."
              howItWorks="The dashboard counts defect rows separately from unique VINs, uses the case-study production assumption only for overall denominator-based rates, and keeps configuration results as report counts because configuration production volumes were not supplied."
            />

            <QualityOverview defects={defects} />
            <RateMethodologyCard />
            <Task1DataBasis defects={defects} />
            <ConfigurationAnalysis defects={defects} />
            <DefectAnalysis defects={defects} />
            <StationAnalysis defects={defects} />
          </>
        )}

        {/* TASK 1 · DATA EXPLORER */}

        {activeTab === 1 && (
          <section className="data-explorer-section">
            <CaseStudyTaskHeader
              task="Task 1"
              title="Data Explorer"
              description="Inspect the source records behind the dashboard. Search, filter, sort and open a complete defect record before making an engineering decision."
              howItWorks="One row represents one reported defect. The table exposes the source fields used by the KPI, outlier, tracking and AI workflows, so conclusions can be traced back to the underlying data."
            />
            <DefectTable defects={defects} />
          </section>
        )}

        {/* TASK 2 · OUTLIER DETECTION */}

        {activeTab === 2 && (
          <>
            <CaseStudyTaskHeader
              task="Task 2"
              title="Dynamic Outlier Detection"
              description="Automatically identify unusual quality signals using thresholds that adapt to the observed data instead of fixed production cutoffs."
              howItWorks="Each metric family uses a method matched to its distribution: rolling median + MAD for daily volume, IQR for station and rework counts, an adaptive 99th percentile for VIN recurrence, and log1p + IQR for strongly right-skewed resolution time."
            />
            <OutlierDetection defects={defects} />
          </>
        )}

        {/* TASK 3 · QUALITY WORKFLOW + TASK 5 */}

        {activeTab === 3 && (
          <>
            <CaseStudyTaskHeader
              task="Task 3"
              title="Interactive Quality Workflow"
              description="Turn a detected or manually selected defect into an engineer-owned investigation record with an observation, tracking status and owner."
              howItWorks="Task 2 signals can be flagged automatically, while any individual defect can be flagged manually. Tracking Status is separate from the source Resolution Status because investigation progress and production resolution answer different questions. Task 5 then uses the selected tracking record as its AI starting point."
            />
            <QualityWorkflow defects={defects} />
          </>
        )}

        {/* TASK 4 · VEHICLE WATCHLIST */}

        {activeTab === 4 && (
          <>
            <CaseStudyTaskHeader
              task="Task 4"
              title="Vehicle Quality Watchlist"
              description="Prioritize vehicles with repeated quality signals that may not be captured by a single outlier detector."
              howItWorks="The watchlist contains VINs with 2+ reported defects. It adds vehicle-level context without declaring a vehicle defective; engineers still inspect and flag individual defect records through Task 3."
            />
            <VehicleQualityWatchlist defects={defects} />
          </>
        )}
      </main>

      {/* FOOTER */}

      <footer className="dashboard-footer">
        Quality analytics · Source: provided production defect extract ·
        2026-01-01 to 2026-06-30
      </footer>
    </>
    </QualityTrackingProvider>
  );
}
