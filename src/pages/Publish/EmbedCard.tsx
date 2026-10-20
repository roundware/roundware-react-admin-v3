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

  // The frame starts at a sensible height; the script then fits it to the
  // recorder as it changes (its 'resize' messages). Without the script — a
  // site builder that strips it — the starting height stays, and the
  // recorder scrolls inside it.
  const frameId = `roundware-recorder-${projectId}`;
  const layout = options?.layout ?? "auto";
  const startHeight = layout === "horizontal" ? 220 : 360;
  const maxWidth = layout === "vertical" ? 420 : 720;
  const code = (base: string) =>
    [
      `<iframe`,
      `  id="${frameId}"`,
      `  src="${base}/embed?${query}"`,
      `  allow="microphone; camera; geolocation"`,
      `  style="width: 100%; max-width: ${maxWidth}px; height: ${startHeight}px; border: 0;"`,
      `  title="Record a message">`,
      `</iframe>`,
      `<script>`,
      `  window.addEventListener("message", function (e) {`,
      `    var frame = document.getElementById("${frameId}");`,
      `    if (frame && e.source === frame.contentWindow && e.data && e.data.source === "roundware" && e.data.type === "resize") {`,
      `      frame.style.height = e.data.height + "px";`,
      `    }`,
      `  });`,
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
                    record or take photos. The script fits the frame to the recorder; your page must
                    be https.
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
            {trying && <EmbedPreview projectId={projectId} query={query} startHeight={startHeight} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmbedCard;
