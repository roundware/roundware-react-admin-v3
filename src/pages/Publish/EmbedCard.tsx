import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./api";
import PreviewPanel from "./PreviewPanel";

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
}

interface Lang {
  id: number;
  language_code: string;
  name: string;
}

/**
 * The embeddable recorder (server docs/023): the recording flow in an iframe
 * on another site — a podcast's contact page, say. Lists the sites allowed to
 * embed it, chooses its steps, and generates the code to paste.
 */
const EmbedCard: React.FC<Props> = ({ projectId, liveUrl, testUrl }) => {
  const [project, setProject] = useState<ProjectBits | null>(null);
  const [languages, setLanguages] = useState<Lang[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [trying, setTrying] = useState(false);
  const [copied, setCopied] = useState(false);
  // The recorder's steps. They start as the project's own settings.
  const [questions, setQuestions] = useState(false);
  const [location, setLocation] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [text, setText] = useState(false);
  const [upload, setUpload] = useState<"auto" | "always" | "never">("auto");
  const [contact, setContact] = useState(false);
  const [lang, setLang] = useState("");
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">("auto");
  const [size, setSize] = useState<"compact" | "comfortable">("compact");

  useEffect(() => {
    Promise.all([apiFetcher(`/projects/${projectId}/`), apiFetcher(`/languages/`)])
      .then(([p, l]) => {
        const bits = p.json as ProjectBits;
        setProject({ ...bits, embed_allowed_sites: bits.embed_allowed_sites ?? [] });
        setQuestions(!!bits.allow_speak_tags);
        setPhoto(!!bits.allow_photos);
        setText(!!bits.allow_text);
        const all = (Array.isArray(l.json) ? l.json : (l.json as { results?: Lang[] })?.results ?? []) as Lang[];
        setLanguages(all.filter((x) => (bits.language_ids ?? []).includes(x.id)));
      })
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

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

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("questions", questions ? "1" : "0");
    q.set("location", location ? "1" : "0");
    q.set("photo", photo ? "1" : "0");
    q.set("text", text ? "1" : "0");
    if (contact) q.set("contact", "1");
    if (upload !== "auto") q.set("upload", upload);
    if (layout !== "auto") q.set("layout", layout);
    if (size !== "compact") q.set("size", size);
    if (lang) q.set("lang", lang);
    return q.toString();
  }, [questions, location, photo, text, contact, upload, layout, size, lang]);

  // The frame starts at a sensible height; the script then fits it to the
  // recorder as it changes (its 'resize' messages). Without the script — a
  // site builder that strips it — the starting height stays, and the
  // recorder scrolls inside it.
  const frameId = `roundware-recorder-${projectId}`;
  const startHeight = layout === "horizontal" ? 220 : 360;
  const maxWidth = layout === "vertical" ? 420 : 720;
  const code = (base: string) =>
    [
      `<iframe`,
      `  id="${frameId}"`,
      `  src="${base}/embed?${query}"`,
      `  allow="microphone; geolocation"`,
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
            Embed a recorder
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

        {project && (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Sites allowed to show it
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={sites}
                onChange={(_e, value) => saveSites(value as string[])}
                renderTags={(value, getTagProps) =>
                  value.map((site, index) => <Chip size="small" label={site} {...getTagProps({ index })} key={site} />)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={sites.length ? "Add another" : "mypodcast.com"}
                    helperText="Type a site and press Enter. Any page on it works, and its subdomains (www., shop. …)."
                  />
                )}
              />
              {sites.length === 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No sites yet: browsers won't show the recorder anywhere until you add the site
                  your page is on.
                </Alert>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                What it asks
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap columnGap={1}>
                <FormControlLabel
                  control={<Checkbox checked={questions} onChange={(e) => setQuestions(e.target.checked)} />}
                  label="Questions (Filters & Menus)"
                />
                <FormControlLabel
                  control={<Checkbox checked={location} onChange={(e) => setLocation(e.target.checked)} />}
                  label="Location"
                />
                <FormControlLabel
                  control={<Checkbox checked={photo} onChange={(e) => setPhoto(e.target.checked)} />}
                  label="Add a photo"
                />
                <FormControlLabel
                  control={<Checkbox checked={text} onChange={(e) => setText(e.target.checked)} />}
                  label="Add text"
                />
                <FormControlLabel
                  control={<Checkbox checked={contact} onChange={(e) => setContact(e.target.checked)} />}
                  label="Name and email"
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">
                Recordings are placed at the project's location
                {location ? " unless the contributor changes it" : ""}. Name and email are optional
                for contributors, and only your team sees them.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Uploading an audio file</InputLabel>
                <Select
                  label="Uploading an audio file"
                  value={upload}
                  onChange={(e) => setUpload(e.target.value as typeof upload)}
                >
                  <MenuItem value="auto">On wide screens (as in the app)</MenuItem>
                  <MenuItem value="always">Always offered</MenuItem>
                  <MenuItem value="never">Never</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel shrink>Language</InputLabel>
                <Select label="Language" notched displayEmpty value={lang} onChange={(e) => setLang(e.target.value)}>
                  <MenuItem value="">The visitor's own</MenuItem>
                  {languages.map((l) => (
                    <MenuItem key={l.id} value={l.language_code}>
                      {l.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>Layout</InputLabel>
                <Select label="Layout" value={layout} onChange={(e) => setLayout(e.target.value as typeof layout)}>
                  <MenuItem value="auto">By its width</MenuItem>
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                  <MenuItem value="vertical">Vertical</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Size</InputLabel>
                <Select label="Size" value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="comfortable">Comfortable</MenuItem>
                </Select>
              </FormControl>
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
                    Keep <code>allow="microphone"</code>: without it, browsers won't let it record.
                    The script fits the frame to the recorder; your page must be https.
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

        <Dialog open={trying} onClose={() => setTrying(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: "flex", alignItems: "center", py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>The recorder, as embedded</Box>
            <IconButton onClick={() => setTrying(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {trying && (
              <PreviewPanel
                projectId={projectId}
                refreshKey={0}
                title="Recorder"
                path="/embed"
                query={query}
                height={480}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmbedCard;
