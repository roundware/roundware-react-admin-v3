import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./api";
import EmbedPreview from "./EmbedPreview";
import {
  EmbedLanguage,
  EmbedOptions,
  EmbedSitesField,
  RecorderOptionsFields,
  embedOptionsFor,
  embedQuery,
} from "./RecorderOptions";

interface Props {
  projectId: number;
  /** The live site's address, once published: the embed is served from it. */
  liveUrl: string | null;
  /** The test site's: to try the embed before updating the live site. */
  testUrl: string | null;
}

interface ProjectBits {
  allow_speak_tags: boolean;
  allow_photos: boolean;
  allow_text: boolean;
  language_ids: number[];
  embed_allowed_sites: string[];
  embed_options?: Partial<EmbedOptions> | null;
}

/**
 * The embeddable recorder (server docs/023): the recording flow in an iframe
 * on another site — a podcast's contact page, say. Lists the sites allowed to
 * embed it, chooses its steps, and generates the code to paste.
 */
const EmbedCard: React.FC<Props> = ({ projectId, liveUrl, testUrl }) => {
  const [project, setProject] = useState<ProjectBits | null>(null);
  const [languages, setLanguages] = useState<EmbedLanguage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [trying, setTrying] = useState(false);
  const [copied, setCopied] = useState(false);
  // The recorder's choices: the project's saved ones (the wizard's embed
  // step, or earlier visits here), else its own settings.
  const [options, setOptions] = useState<EmbedOptions | null>(null);

  useEffect(() => {
    Promise.all([apiFetcher(`/projects/${projectId}/`), apiFetcher(`/languages/`)])
      .then(([p, l]) => {
        const bits = p.json as ProjectBits;
        setProject({ ...bits, embed_allowed_sites: bits.embed_allowed_sites ?? [] });
        setOptions(embedOptionsFor(bits, bits.embed_options));
        const all = (Array.isArray(l.json) ? l.json : (l.json as { results?: EmbedLanguage[] })?.results ?? []) as EmbedLanguage[];
        setLanguages(all.filter((x) => (bits.language_ids ?? []).includes(x.id)));
      })
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

  // Kept as they change, a moment after the last one, so the code is the
  // same next time.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);
  const changeOptions = (patch: Partial<EmbedOptions>) => {
    if (!options) return;
    const next = { ...options, ...patch };
    setOptions(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ embed_options: next }),
      }).catch((e) => setError(errMessage(e)));
    }, 600);
  };

  const saveSites = async (typed: string[]) => {
    setError(null);
    try {
      const { json } = await apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ embed_allowed_sites: typed }),
      });
      // The server keeps each as its root domain.
      setProject((p) => (p ? { ...p, embed_allowed_sites: (json as ProjectBits).embed_allowed_sites } : p));
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const query = useMemo(() => (options ? embedQuery(options) : ""), [options]);

  // The page gives the recorder its space — a box of the height chosen here,
  // which the host can change like any other element — and the recorder
  // fills it, never resizing it (Halsey, 2026-10-27). While a panel is open
  // (an answer to choose, the terms, a place), the script lets the frame
  // grow over the page below, moving nothing; without the script — a site
  // builder that strips it — the panel scrolls inside the box.
  const frameId = `roundware-recorder-${projectId}`;
  const layout = options?.layout ?? "auto";
  const height = options?.height ?? (layout === "vertical" ? 380 : 260);
  const maxWidth = layout === "vertical" ? 420 : 720;
  const [heightText, setHeightText] = useState<string | null>(null);
  const setHeight = (h: number) => {
    setHeightText(null);
    changeOptions({ height: Math.min(1200, Math.max(120, Math.round(h))) });
  };
  const code = (base: string) =>
    [
      `<div id="${frameId}" style="position: relative; width: 100%; max-width: ${maxWidth}px; height: ${height}px;">`,
      `  <iframe`,
      `    src="${base}/embed?${query}"`,
      `    allow="microphone; camera; geolocation"`,
      `    title="Record a message"`,
      `    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;">`,
      `  </iframe>`,
      `</div>`,
      `<script>`,
      `  (function () {`,
      `    var box = document.getElementById("${frameId}");`,
      `    var frame = box && box.querySelector("iframe");`,
      `    window.addEventListener("message", function (e) {`,
      `      if (!frame || e.source !== frame.contentWindow || !e.data || e.data.source !== "roundware" || e.data.type !== "overlay") return;`,
      `      // A panel is open: the recorder grows over the page below it, moving nothing.`,
      `      var tall = e.data.height > box.clientHeight;`,
      `      frame.style.height = tall ? e.data.height + "px" : "100%";`,
      `      frame.style.zIndex = tall ? "1000" : "";`,
      `      var r = frame.getBoundingClientRect();`,
      `      if (tall && r.bottom > window.innerHeight) window.scrollBy({ top: Math.min(r.bottom - window.innerHeight + 16, r.top - 16), behavior: "smooth" });`,
      `    });`,
      `  })();`,
      `</script>`,
    ].join("\n");

  const sites = project?.embed_allowed_sites ?? [];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <CodeIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Recording embed
          </Typography>
          <Button variant="outlined" size="small" onClick={() => setTrying(true)}>
            Try it
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Put the recorder on your own web page — a podcast's contact page, say — so people can
          record without leaving it. Paste the code below into the page, where you want the
          recorder. It uses the live site's look, wording and language.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {project && options && (
          <Stack spacing={2.5}>
            <EmbedSitesField sites={sites} onChange={saveSites} />
            <RecorderOptionsFields value={options} onChange={changeOptions} languages={languages} />

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                label="Height on your page"
                type="number"
                size="small"
                value={heightText ?? String(height)}
                onChange={(e) => setHeightText(e.target.value)}
                onBlur={() => {
                  const n = Number(heightText);
                  if (heightText !== null && Number.isFinite(n) && n > 0) setHeight(n);
                  else setHeightText(null);
                }}
                InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">px</Typography> }}
                sx={{ width: 180, flexShrink: 0 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                The space it takes on your page; the recorder fills it and never changes it. Choosing
                an answer or adding details opens over your page below, then closes back. Try it to
                see how much height it needs; you can also change the height in the code.
              </Typography>
            </Stack>

            {liveUrl ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Code to paste
                </Typography>
                <TextField
                  value={code(liveUrl)}
                  multiline
                  fullWidth
                  InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: 13 } }}
                />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard?.writeText(code(liveUrl));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Copied" : "Copy code"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Keep <code>allow="microphone; camera"</code>: without it, browsers won't let it
                    record or take photos. The script lets it open over your page; your page must be
                    https.
                  </Typography>
                </Stack>
                {testUrl && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    To try changes before updating the live site, use the test site's address
                    instead: <code>{testUrl}/embed?…</code> — recordings made there are tests.
                  </Typography>
                )}
              </Box>
            ) : (
              <Alert severity="info">Publish the project to get the code: the recorder is served from its address.</Alert>
            )}
          </Stack>
        )}

        <Dialog open={trying} onClose={() => setTrying(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{ display: "flex", alignItems: "center", py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>The recorder, as embedded</Box>
            <IconButton onClick={() => setTrying(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {trying && (
              <EmbedPreview projectId={projectId} query={query} height={height} maxWidth={maxWidth} onUseHeight={setHeight} />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmbedCard;
