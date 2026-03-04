// ---------------------------------------------------------------------------
// Onboarding Plan Selection — shown after registration, before first project
// ---------------------------------------------------------------------------
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

interface PlanData {
  id: number;
  name: string;
  max_projects: number;
  max_assets_per_project: number;
  max_speakers_per_project: number;
  max_storage_mb: number;
  max_recording_length_sec: number;
  max_members: number;
  price_cents_monthly: number;
}

/** Human-readable feature list for a plan */
function planFeatures(p: PlanData): string[] {
  const features: string[] = [];
  features.push(
    p.max_projects === -1
      ? "Unlimited projects"
      : `${p.max_projects} project${p.max_projects !== 1 ? "s" : ""}`
  );
  features.push(
    `${p.max_assets_per_project.toLocaleString()} assets per project`
  );
  features.push(formatStorage(p.max_storage_mb));
  features.push(
    `${p.max_members} team member${p.max_members !== 1 ? "s" : ""}`
  );
  features.push(formatDuration(p.max_recording_length_sec));
  return features;
}

function formatStorage(mb: number): string {
  if (mb >= 1000) return `${Math.round(mb / 1000)} GB storage`;
  return `${mb} MB storage`;
}

function formatDuration(sec: number): string {
  if (sec >= 60) return `${Math.round(sec / 60)} min max recording`;
  return `${sec}s max recording`;
}

function formatPrice(cents: number): { amount: string; period: string } {
  if (cents === 0) return { amount: "$0", period: "forever" };
  return { amount: `$${Math.round(cents / 100)}`, period: "/month" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OnboardingPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");

  // Redirect to register if no auth token
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      navigate("/register");
    }
  }, [navigate]);

  // Fetch available plans
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/3/billing/plans/`)
      .then((resp) => {
        if (!resp.ok) throw new Error(`Failed to load plans (${resp.status})`);
        return resp.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPlans(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load plans");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectPlan = (plan: PlanData) => {
    if (plan.price_cents_monthly === 0) {
      // Free plan — go straight to wizard
      navigate("/wizard");
    } else {
      // Paid plan — show "coming soon" dialog
      setSelectedPlanName(plan.name);
      setComingSoonOpen(true);
    }
  };

  const handleComingSoonClose = () => {
    setComingSoonOpen(false);
    // Proceed with Free plan to wizard
    navigate("/wizard");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#fff" }} size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <img
            src="/logo.png"
            alt="Roundware"
            style={{ width: 64, marginBottom: 16 }}
          />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#fff", mb: 1 }}
          >
            Choose Your Plan
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.85)", maxWidth: 500, mx: "auto" }}
          >
            Select a plan to get started. You can always upgrade later as your
            projects grow.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => {
            const { amount, period } = formatPrice(plan.price_cents_monthly);
            const features = planFeatures(plan);
            const isFree = plan.price_cents_monthly === 0;
            const isHighlighted = plan.name === "Pro";

            return (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    position: "relative",
                    border: isHighlighted ? "2px solid" : "1px solid",
                    borderColor: isHighlighted ? "primary.main" : "divider",
                    boxShadow: isHighlighted ? 6 : 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 8,
                    },
                  }}
                >
                  {isHighlighted && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="center"
                      alignItems="baseline"
                      spacing={0.5}
                      sx={{ mb: 3 }}
                    >
                      <Typography variant="h3" fontWeight="bold">
                        {amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {period}
                      </Typography>
                    </Stack>
                    <Stack
                      spacing={1.5}
                      sx={{ mb: 3, textAlign: "left", minHeight: 150 }}
                    >
                      {features.map((feat) => (
                        <Typography key={feat} variant="body2">
                          ✓ {feat}
                        </Typography>
                      ))}
                    </Stack>
                    <Button
                      variant={isHighlighted ? "contained" : "outlined"}
                      fullWidth
                      size="large"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isFree ? "Get Started Free" : `Choose ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="text"
            sx={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => navigate("/wizard")}
          >
            Skip — start with Free plan
          </Button>
        </Box>
      </Container>

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)}>
        <DialogTitle>
          {selectedPlanName} Plan — Coming Soon
        </DialogTitle>
        <DialogContent>
          <Typography>
            Paid plans with Stripe payment integration are coming soon.
            For now, you&apos;ll start on the Free plan. You can upgrade
            at any time once billing is available.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComingSoonOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleComingSoonClose}>
            Continue with Free Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingPlanPage;
