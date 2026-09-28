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
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  fetchPlans,
  formatPrice,
  PlanData,
  planFeatures,
  switchPlan,
} from "../utilities/plans";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OnboardingPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<number | null>(null);

  // Redirect to register if no auth token
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      navigate("/register");
    }
  }, [navigate]);

  // Fetch available plans
  useEffect(() => {
    let cancelled = false;
    fetchPlans()
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

  // Registration puts every new organisation on Free. Any other choice is a
  // real switch: while billing is off, every plan is free to choose
  // (roundware-server-v3 docs/013).
  const handleSelectPlan = async (plan: PlanData) => {
    if (plan.price_cents_monthly === 0) {
      navigate("/wizard");
      return;
    }
    setChoosing(plan.id);
    setError(null);
    try {
      await switchPlan(plan.id);
      navigate("/wizard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not choose that plan.");
      setChoosing(null);
    }
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
            Select a plan to get started. You can change it any time from the
            Plan page.
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
                      disabled={choosing !== null}
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

    </Box>
  );
};

export default OnboardingPlanPage;
