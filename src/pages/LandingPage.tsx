// ---------------------------------------------------------------------------
// Landing page — public marketing page for unauthenticated visitors
// ---------------------------------------------------------------------------
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  Explore,
  GitHub,
  GraphicEq,
  Language,
  RecordVoiceOver,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  fetchPlans,
  formatPrice,
  planFeatures,
  PlanData,
} from "../utilities/plans";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: <GraphicEq fontSize="large" color="primary" />,
    title: "Geo-Located Audio",
    description:
      "Stream audio tied to specific locations. Participants hear different sounds as they move through physical spaces.",
  },
  {
    icon: <RecordVoiceOver fontSize="large" color="primary" />,
    title: "Participatory Contributions",
    description:
      "Collect voice recordings, stories, and sounds from participants anywhere in the world through mobile and web apps.",
  },
  {
    icon: <Explore fontSize="large" color="primary" />,
    title: "Flexible Experiences",
    description:
      "Build sound walks, story maps, interactive installations, and more with customizable tags, speakers, and playback.",
  },
  {
    icon: <Language fontSize="large" color="primary" />,
    title: "Multi-Language Support",
    description:
      "Create projects in any language. All content is fully localizable for global audiences.",
  },
];

const GITHUB = "https://github.com/roundware";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  // The plans as the server has them (the Plan page's list), so prices and
  // limits here can't drift from the real ones. None: no pricing section.
  const [plans, setPlans] = useState<PlanData[]>([]);
  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ---- Navigation Bar ---- */}
      <Box
        sx={{
          bgcolor: "#1a1a2e",
          py: { xs: 1.5, sm: 2 },
          px: { xs: 0, sm: 3 },
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box
              component="img"
              src="/brand/roundware-logo.png"
              alt="Roundware"
              sx={{
                height: { xs: 30, sm: 46 },
                width: "auto",
                display: "block",
              }}
            />
            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
              <Button
                variant="text"
                sx={{ color: "#fff", whiteSpace: "nowrap" }}
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                sx={{ whiteSpace: "nowrap" }}
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---- Hero Section ---- */}
      <Box
        sx={{
          // The map underneath, darkened so the text reads on it.
          backgroundImage:
            "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.82) 50%, rgba(15, 52, 96, 0.78) 100%), url(/brand/map-background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          py: { xs: 7, md: 11 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Box
            component="img"
            src="/brand/roundware-logo-icons.png"
            alt=""
            sx={{
              width: "100%",
              maxWidth: { xs: 280, md: 400 },
              height: "auto",
              mb: { xs: 4, md: 6 },
            }}
          />
          <Typography
            component="h1"
            variant="h2"
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: { xs: "2rem", md: "3.5rem" } }}
          >
            Build Location-Based Audio Experiences
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.85,
              maxWidth: 600,
              mx: "auto",
              fontSize: { xs: "1rem", md: "1.25rem" },
            }}
          >
            Roundware is a flexible open-source platform for creating
            participatory sound art, storytelling, and interactive listening
            experiences tied to real-world locations.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
              onClick={() => navigate("/register")}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.5)",
                "&:hover": { borderColor: "#fff" },
              }}
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ---- Features Section ---- */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, bgcolor: "#f8f9fa" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
          >
            Why Roundware?
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Everything you need to create immersive, location-aware audio
            experiences — from sound walks to interactive installations.
          </Typography>
          <Grid container spacing={4}>
            {FEATURES.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: 0,
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ---- Open Source ---- */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#16213e", color: "#fff" }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <GitHub sx={{ fontSize: 44, mb: 1.5, opacity: 0.9 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Open source at its core
          </Typography>
          <Typography
            variant="body1"
            sx={{ opacity: 0.85, mb: 3, maxWidth: 620, mx: "auto" }}
          >
            The Roundware server and framework are open source under the AGPL,
            developed in the open. Run them on your own servers, or start here
            and have a project online in minutes.
          </Typography>
          <Button
            variant="outlined"
            size="large"
            href={GITHUB}
            target="_blank"
            rel="noopener"
            startIcon={<GitHub />}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": { borderColor: "#fff" },
            }}
          >
            Roundware on GitHub
          </Button>
        </Container>
      </Box>

      {/* ---- Pricing Section ---- */}
      {plans.length > 0 && (
        <Box id="pricing" sx={{ py: { xs: 6, md: 10 } }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              fontWeight="bold"
              textAlign="center"
              gutterBottom
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography
              variant="body1"
              textAlign="center"
              color="text.secondary"
              sx={{ mb: 6, maxWidth: 500, mx: "auto" }}
            >
              Start free and scale as your projects grow. No hidden fees.
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {plans.map((plan, i) => {
                const price = formatPrice(plan.price_cents_monthly);
                const p = {
                  name: plan.name,
                  price: price.amount,
                  period: price.period,
                  features: planFeatures(plan),
                  free: plan.price_cents_monthly === 0,
                  // The first paid plan, set off a little.
                  highlighted:
                    plan.price_cents_monthly > 0 &&
                    plans.findIndex((x) => x.price_cents_monthly > 0) === i,
                };
                return (
                  <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      sx={{
                        height: "100%",
                        textAlign: "center",
                        border: p.highlighted ? "2px solid" : "1px solid",
                        borderColor: p.highlighted ? "primary.main" : "divider",
                        position: "relative",
                        boxShadow: p.highlighted ? 4 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {p.name}
                        </Typography>
                        <Stack
                          direction="row"
                          justifyContent="center"
                          alignItems="baseline"
                          spacing={0.5}
                          sx={{ mb: 3 }}
                        >
                          <Typography variant="h3" fontWeight="bold">
                            {p.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {p.period}
                          </Typography>
                        </Stack>
                        <Stack spacing={1.5} sx={{ mb: 3, textAlign: "left" }}>
                          {p.features.map((feat) => (
                            <Typography key={feat} variant="body2">
                              ✓ {feat}
                            </Typography>
                          ))}
                        </Stack>
                        <Button
                          variant={p.highlighted ? "contained" : "outlined"}
                          fullWidth
                          size="large"
                          onClick={() => navigate("/register")}
                          disabled={!p.free}
                        >
                          {p.free ? "Get Started Free" : "Coming Soon"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ---- Footer ---- */}
      <Box sx={{ bgcolor: "#1a1a2e", color: "#fff", py: 4 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Roundware. The server and
              framework are open source (AGPL-3.0).
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                variant="text"
                size="small"
                sx={{ color: "#fff", opacity: 0.7 }}
                href="https://roundware.org"
                target="_blank"
                rel="noopener"
              >
                About
              </Button>
              <Button
                variant="text"
                size="small"
                sx={{ color: "#fff", opacity: 0.7 }}
                href={GITHUB}
                target="_blank"
                rel="noopener"
              >
                GitHub
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
