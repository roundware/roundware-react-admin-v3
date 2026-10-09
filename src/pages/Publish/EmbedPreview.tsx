import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { mintPreviewToken, webappUrl } from "./api";

interface Props {
  projectId: number;
  /** The embed link's choices, as in the generated code. */
  query: string;
  /** Where the frame starts, as in the generated code. */
  startHeight: number;
}

// Two widths to see both layouts: a sidebar or phone, and a page's column.
const WIDTHS = { narrow: 380, wide: 720 } as const;

/**
 * The embedded recorder as a page would show it (server docs/023): a frame
 * on a plain page, fitted to the recorder by its resize messages, exactly as
 * the generated code's script does — not the app preview's phone, whose fixed
 * height left empty space below the recorder.
 */
const EmbedPreview: React.FC<Props> = ({ projectId, query, startHeight }) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState<keyof typeof WIDTHS>("narrow");
  const [height, setHeight] = useState(startHeight);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    mintPreviewToken(projectId)
      .then((t) => !cancelled && setToken(t))
      .catch(() => !cancelled && setError("Could not start the preview."));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.source === "roundware" && e.data.type === "resize") {
        setHeight(e.data.height);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const src = token
    ? `${webappUrl()}/embed?preview=1&project_id=${projectId}&token=${encodeURIComponent(token)}&${query}`
    : "";

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup size="small" exclusive value={width} onChange={(_e, v) => v && setWidth(v)} sx={{ alignSelf: "flex-start" }}>
        <ToggleButton value="narrow" sx={{ textTransform: "none" }}>
          Narrow ({WIDTHS.narrow}px)
        </ToggleButton>
        <ToggleButton value="wide" sx={{ textTransform: "none" }}>
          Wide ({WIDTHS.wide}px)
        </ToggleButton>
      </ToggleButtonGroup>
      {/* A stand-in for the page around it. */}
      <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2, overflowX: "auto" }}>
        {src ? (
          <iframe
            ref={frame}
            key={src}
            title="Recorder"
            src={src}
            allow="microphone; camera; geolocation"
            style={{ display: "block", width: WIDTHS[width], maxWidth: "100%", height, border: 0 }}
          />
        ) : (
          <Box sx={{ height: startHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {error ? <Typography color="error">{error}</Typography> : <CircularProgress size={24} />}
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default EmbedPreview;
