import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import ComputerIcon from "@mui/icons-material/Computer";
import TabletIcon from "@mui/icons-material/TabletMac";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import { mintPreviewToken, webappUrl } from "./api";

interface Props {
  projectId: number;
  /** Bumped by the parent when branding is saved, to reload the iframe. */
  refreshKey: number;
  /** The preview area's height (the Test app page fills the window). */
  height?: number | string;
  /** Heading above the controls. */
  title?: string;
  /** The app screen to open on, e.g. "/speak/tags/0" (default: the start). */
  path?: string;
  /** More of the link, e.g. "lang=es&rw_focus=filters". */
  query?: string;
}

type Device = "mobile" | "tablet" | "desktop";

// Phone and tablet are fixed sizes (an iPhone; an iPad in portrait), limited
// to the space there is — the app reflows, as it would on a smaller device.
// Desktop fills the space.
const SIZES: Record<Exclude<Device, "desktop">, { width: number; height: number }> = {
  mobile: { width: 390, height: 720 },
  tablet: { width: 768, height: 1024 },
};

const PreviewPanel: React.FC<Props> = ({
  projectId,
  refreshKey,
  height = 720,
  title = "Preview",
  path = "/",
  query,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBump, setLocalBump] = useState(0);

  const reloadKey = `${refreshKey}-${localBump}`;

  // A fresh token on every load, reloads included: tokens last 30 minutes,
  // and a long test session would otherwise reload into an error.
  useEffect(() => {
    let cancelled = false;
    mintPreviewToken(projectId)
      .then((t) => !cancelled && setToken(t))
      .catch(() => !cancelled && setError("Could not start preview."));
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey, localBump]);

  const src = token
    ? `${webappUrl()}${path}?preview=1&project_id=${projectId}&token=${encodeURIComponent(
        token
      )}${query ? `&${query}` : ""}&_=${reloadKey}`
    : "";

  const iframe = (d: Device) => (
    <Box
      sx={{
        width: d === "desktop" ? "100%" : SIZES[d].width,
        maxWidth: "100%",
        height: d === "desktop" ? "100%" : SIZES[d].height,
        maxHeight: "100%",
        mx: "auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#000",
      }}
    >
      {src ? (
        <iframe
          key={`${device}-${reloadKey}`}
          title="Web app preview"
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="microphone; camera; geolocation; autoplay"
        />
      ) : (
        <Box
          sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <CircularProgress sx={{ color: "#fff" }} />
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={device}
            onChange={(_, v) => v && setDevice(v)}
          >
            <ToggleButton value="mobile" title="Phone">
              <SmartphoneIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="tablet" title="Tablet">
              <TabletIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="desktop" title="Desktop">
              <ComputerIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Reload preview">
            <IconButton size="small" onClick={() => setLocalBump((n) => n + 1)}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small" onClick={() => setFullscreen(true)}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box sx={{ height, display: "flex", alignItems: "flex-start" }}>
        {iframe(device)}
      </Box>

      {/* A dialog, drawn above everything: as a fixed box inside the page it
          sat under the admin's top bar on some pages, hiding its own close
          button. Esc closes it too. */}
      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", p: 3, display: "flex", flexDirection: "column" } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={device}
            onChange={(_, v) => v && setDevice(v)}
            sx={{ bgcolor: "background.paper" }}
          >
            <ToggleButton value="mobile" title="Phone">
              <SmartphoneIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="tablet" title="Tablet">
              <TabletIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="desktop" title="Desktop">
              <ComputerIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Reload preview">
              <IconButton onClick={() => setLocalBump((n) => n + 1)} sx={{ color: "#fff" }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exit full screen (Esc)">
              <IconButton onClick={() => setFullscreen(false)} sx={{ color: "#fff" }} aria-label="Exit full screen">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0 }}>{iframe(device)}</Box>
      </Dialog>
    </>
  );
};

export default PreviewPanel;
