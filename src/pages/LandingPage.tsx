// ---------------------------------------------------------------------------
// Landing page — public marketing page for unauthenticated visitors
// ---------------------------------------------------------------------------
import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  Explore,
  GraphicEq,
  Language,
  RecordVoiceOver,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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
      "Build sound walks, story maps, interactive installations, and more with customizable tags, speakers, and audio tracks.",
  },
  {
    icon: <Language fontSize="large" color="primary" />,
    title: "Multi-Language Support",
    description:
      "Create projects in any language. All content is fully localizable for global audiences.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "1 project",
      "100 assets",
      "500 MB storage",
      "2 team members",
      "60s max recording",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "5 projects",
      "2,000 assets",
      "10 GB storage",
      "5 team members",
      "3 min recordings",
    ],
    cta: "Coming Soon",
    highlighted: true,
  },
  {
    name: "Ultra",
    price: "$99",
    period: "/month",
    features: [
      "Unlimited projects",
      "50,000 assets",
      "100 GB storage",
      "20 team members",
      "10 min recordings",
    ],
    cta: "Coming Soon",
    highlighted: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ---- Navigation Bar ---- */}
      <Box
        sx={{
          bgcolor: "#1a1a2e",
          py: 2,
          px: 3,
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
            <Stack direction="row" spacing={1} alignItems="center">
              <img
                src="/logo.png"
                alt="Roundware"
                style={{ width: 36, height: 36 }}
              />
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: "#fff" }}
              >
                Roundware
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                sx={{ color: "#fff" }}
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
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
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "#fff",
          py: { xs: 8, md: 12 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography
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
            Roundware is a flexible platform for creating participatory sound
            art, storytelling, and interactive listening experiences tied to
            real-world locations.
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

      {/* ---- Pricing Section ---- */}
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
            {PLANS.map((p) => (
              <Grid key={p.name} size={{ xs: 12, sm: 6, md: 4 }}>
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
                  {p.highlighted && (
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
                      disabled={p.cta === "Coming Soon"}
                    >
                      {p.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

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
              &copy; {new Date().getFullYear()} Roundware. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                variant="text"
                size="small"
                sx={{ color: "#fff", opacity: 0.7 }}
                href="https://roundware.org"
                target="_blank"
              >
                About
              </Button>
              <Button
                variant="text"
                size="small"
                sx={{ color: "#fff", opacity: 0.7 }}
                href="https://github.com/roundware"
                target="_blank"
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
