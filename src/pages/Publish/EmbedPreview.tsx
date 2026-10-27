import React, { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { mintPreviewToken, webappUrl } from "./api";

interface Props {
  projectId: number;
  /** The embed link's choices, as in the generated code. */
  query: string;
  /** The space it's given, as in the generated code. */
  height: number;
  /** The widest the code lets it be. */
  maxWidth: number;
  /** Set the code's height (to what the recorder needs at this width). */
  onUseHeight: (height: number) => void;
}

// Two widths to see both layouts: a sidebar or phone, and a page's column.
const WIDTHS = { narrow: 380, wide: 720 } as const;

/**
 * The embedded recorder as a page would show it (server docs/023, 2026-10-27):
 * the generated code's box, of the height chosen, with the recorder filling
 * it, and the page's content below — which a panel opens over, as the code's
 * script lets it, without moving it. And how tall the recorder's content is
 * at this width, to choose the height by.
 */
const EmbedPreview: React.FC<Props> = ({ projectId, query, height, maxWidth, onUseHeight }) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState<keyof typeof WIDTHS>("narrow");
  const [fit, setFit] = useState<number | null>(null);
  const [overlay, setOverlay] = useState(0);
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
      if (e.source !== frame.current?.contentWindow || e.data?.source !== "roundware") return;
      if (e.data.type === "fit") setFit(e.data.height);
      if (e.data.type === "overlay") setOverlay(e.data.height || 0);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  // A new width or layout: measured again.
  useEffect(() => setFit(null), [width, query]);

  const src = token
    ? `${webappUrl()}/embed?preview=1&project_id=${projectId}&token=${encodeURIComponent(token)}&${query}`
    : "";
  const tall = overlay > height;
  const suggested = fit ? Math.ceil(fit / 10) * 10 : null;
  const boxWidth = Math.min(WIDTHS[width], maxWidth);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup size="small" exclusive value={width} onChange={(_e, v) => v && setWidth(v)}>
          <ToggleButton value="narrow" sx={{ textTransform: "none" }}>
            Narrow ({WIDTHS.narrow}px)
          </ToggleButton>
          <ToggleButton value="wide" sx={{ textTransform: "none" }}>
            Wide ({WIDTHS.wide}px)
          </ToggleButton>
        </ToggleButtonGroup>
        {suggested !== null && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color={suggested > height ? "warning.main" : "text.secondary"}>
              {suggested > height
                ? `At this width it needs ${suggested}px to show everything; it has ${height}px, so it scrolls.`
                : `At this width everything fits in ${suggested}px; it has ${height}px.`}
            </Typography>
            {suggested !== height && (
              <Button size="small" onClick={() => onUseHeight(suggested)}>
                Use {suggested}px
              </Button>
            )}
          </Stack>
        )}
      </Stack>
      {/* A stand-in for the page around it: content above and below. */}
      <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2, overflowX: "auto" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Your page…
        </Typography>
        <Box sx={{ position: "relative", width: boxWidth, maxWidth: "100%", height }}>
          {src ? (
            <iframe
              ref={frame}
              key={src + width}
              title="Recorder"
              src={src}
              allow="microphone; camera; geolocation"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: tall ? overlay : "100%",
                zIndex: tall ? 10 : undefined,
                border: 0,
              }}
            />
          ) : (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {error ? <Typography color="error">{error}</Typography> : <CircularProgress size={24} />}
            </Box>
          )}
        </Box>
        <Box sx={{ mt: 1.5, maxWidth: boxWidth }}>
          <Typography variant="body2" color="text.secondary">
            …and what comes after it on your page. Open a question or Add your name: the recorder opens
            over this, then closes back, and this never moves.
          </Typography>
          {[90, 75, 82].map((w) => (
            <Box key={w} sx={{ height: 10, width: `${w}%`, bgcolor: "divider", borderRadius: 1, mt: 1 }} />
          ))}
        </Box>
      </Box>
    </Stack>
  );
};

export default EmbedPreview;
