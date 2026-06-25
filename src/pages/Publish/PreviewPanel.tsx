import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import ComputerIcon from "@mui/icons-material/Computer";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import { mintPreviewToken, webappUrl } from "./api";

interface Props {
  projectId: number;
  /** Bumped by the parent when branding is saved, to reload the iframe. */
  refreshKey: number;
}

type Device = "mobile" | "desktop";

const PreviewPanel: React.FC<Props> = ({ projectId, refreshKey }) => {
  const [token, setToken] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBump, setLocalBump] = useState(0);

  const reloadKey = `${refreshKey}-${localBump}`;

  useEffect(() => {
    let cancelled = false;
    mintPreviewToken(projectId)
      .then((t) => !cancelled && setToken(t))
      .catch(() => !cancelled && setError("Could not start preview."));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const src = token
    ? `${webappUrl()}/?preview=1&project_id=${projectId}&token=${encodeURIComponent(
        token
      )}&_=${reloadKey}`
    : "";

  const iframe = (mobile: boolean) => (
    <Box
      sx={{
        width: mobile ? 390 : "100%",
        maxWidth: "100%",
        height: mobile ? 720 : "100%",
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
          allow="microphone; geolocation; autoplay"
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
        <Typography variant="h6">Preview</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={device}
            onChange={(_, v) => v && setDevice(v)}
          >
            <ToggleButton value="mobile">
              <SmartphoneIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="desktop">
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

      <Box sx={{ height: 720, display: "flex", alignItems: "flex-start" }}>
        {iframe(device === "mobile")}
      </Box>

      {fullscreen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            bgcolor: "rgba(0,0,0,0.85)",
            p: 3,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={device}
              onChange={(_, v) => v && setDevice(v)}
              sx={{ bgcolor: "background.paper" }}
            >
              <ToggleButton value="mobile">
                <SmartphoneIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="desktop">
                <ComputerIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={() => setFullscreen(false)} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0 }}>{iframe(device === "mobile")}</Box>
        </Box>
      )}
    </>
  );
};

export default PreviewPanel;
