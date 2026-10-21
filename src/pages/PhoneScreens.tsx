import { Box, Container, Stack, Typography } from "@mui/material";
import React, { useState } from "react";

/**
 * The app as a participant sees it, on the landing page: screenshots in
 * phone frames. Each file in public/brand/screens/ is an iPhone screenshot
 * from the status bar (in the project's Backdrop color) down to the app's
 * bottom edge — Safari's toolbar cropped off — at 720 wide; the frame takes
 * the screenshot's shape, so nothing is cut off. A
 * screenshot that isn't there is left out, and with none the section
 * doesn't show at all.
 */
const SCREENS = [
  {
    file: "/brand/screens/start.webp",
    title: "Start",
    caption: "A project's own look, logo and words.",
  },
  {
    file: "/brand/screens/listen.webp",
    title: "Listen",
    caption: "Walk the map and hear what's near you.",
  },
  {
    file: "/brand/screens/record.webp",
    title: "Contribute",
    caption: "Record a voice and pin it to the place.",
  },
];

const Phone: React.FC<{ src: string; alt: string; onMissing: () => void }> = ({
  src,
  alt,
  onMissing,
}) => (
  <Box
    sx={{
      position: "relative",
      width: { xs: 220, md: 240 },
      borderRadius: "38px",
      border: "10px solid #111",
      bgcolor: "#111",
      boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25), inset 0 0 0 1px #333",
      overflow: "hidden",
      mx: "auto",
    }}
  >
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={onMissing}
      // The screenshots' size, so the frame has its shape before they load.
      width={720}
      height={1378}
      sx={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: "28px",
      }}
    />
    {/* The camera island, in the middle of the status bar. */}
    <Box
      sx={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: "32%",
        height: 20,
        borderRadius: 10,
        bgcolor: "#111",
      }}
    />
  </Box>
);

const PhoneScreens: React.FC = () => {
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const shown = SCREENS.filter((s) => !missing.has(s.file));
  if (shown.length === 0) return null;
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
        >
          What participants see
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: "auto" }}
        >
          Every project is a web app on its own address: nothing to install, on
          any phone.
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 6, md: 4 }}
          justifyContent="center"
          alignItems="center"
        >
          {shown.map((s) => (
            <Box key={s.file} sx={{ textAlign: "center", maxWidth: 280 }}>
              <Phone
                src={s.file}
                alt={`The app: ${s.title}`}
                onMissing={() => setMissing((m) => new Set(m).add(s.file))}
              />
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 3 }}>
                {s.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.caption}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default PhoneScreens;
