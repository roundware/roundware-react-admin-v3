import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import hooksFile from "../../config/webAppCssHooks.json";
import { errMessage, FileSlot, getBranding, getBrandingSchema, patchBranding, webappUrl } from "./api";

interface Props {
  projectId: number;
  onSaved?: () => void;
  /** False while another Look & Feel tab is showing: picking stops. */
  active?: boolean;
}

interface Hook {
  name: string;
  where: string;
  scope?: boolean;
}

const HOOKS = (hooksFile as { hooks: Hook[] }).hooks;

/** Worked examples, each insertable (Halsey, 2026-10-21). */
const EXAMPLES: { title: string; css: (image?: string) => string }[] = [
  {
    title: "A see-through header",
    css: () => `.rw-header {\n  background: rgba(0, 0, 0, 0.35);\n  backdrop-filter: blur(6px);\n}`,
  },
  {
    title: "The embedded recorder, square and flat",
    css: () => `html.rw-embed .rw-embed-recorder {\n  border-radius: 0;\n  box-shadow: none;\n}`,
  },
  {
    title: "Hide the walk / map toggle",
    css: () => `.rw-walk-toggle {\n  display: none;\n}`,
  },
  {
    title: "A spaced-out splash title",
    css: () => `.rw-intro-title {\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}`,
  },
  {
    title: "A larger Sound button, on the map only",
    css: () => `html.rw-page-listen .rw-sound-button {\n  transform: scale(1.2);\n}`,
  },
  {
    // A border needs its style (solid); the buttons share Home's height as
    // flex items, so their size is flex-basis, with the height cap lifted.
    title: "Taller Home buttons with a white border",
    css: () =>
      `html.rw-page-home .rw-home-listen,\nhtml.rw-page-home .rw-home-speak {\n  border: 10px solid white;\n  flex-basis: 300px;\n  max-height: none;\n}`,
  },
  {
    title: "One of your images behind Home",
    css: (image) =>
      `.rw-home {\n  background-image: url("${image ?? "…an image's address, from the list below…"}");\n  background-size: cover;\n}`,
  },
];

/** What the preview said was clicked (web app HookPicker). */
interface Picked {
  hooks: string[];
  scope: string | null;
}

const EXAMPLE = `/* For example: */
.rw-header { background: rgba(0, 0, 0, 0.4); }
html.rw-embed .rw-recording { border-radius: 0; }`;

/**
 * Custom CSS (server docs/029), on paid plans: the project's own CSS over
 * the app and the embedded recorder, using the stable rw- hooks. The server
 * checks it — no @import, no @font-face, url() only for the project's own
 * files — and the preview shows it as soon as it's saved.
 */
const CustomCssPanel: React.FC<Props> = ({ projectId, onSaved, active = true }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saved, setSaved] = useState("");
  const [css, setCss] = useState("");
  const [images, setImages] = useState<{ label: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const pickingRef = React.useRef(false);

  // Pick an element: ask the preview beside this (Look & Feel's), and hear
  // what was clicked. A preview reloaded after a save says "ready", and is
  // asked again while picking.
  const previewOrigin = React.useMemo(() => new URL(webappUrl()).origin, []);
  const toPreview = React.useCallback(
    (on: boolean) => {
      document
        .querySelectorAll<HTMLIFrameElement>('iframe[title="Web app preview"]')
        .forEach((f) => f.contentWindow?.postMessage({ source: "rw-admin", type: "pick", on }, previewOrigin));
    },
    [previewOrigin]
  );
  useEffect(() => {
    pickingRef.current = picking;
  }, [picking]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== previewOrigin || e.data?.source !== "rw-preview") return;
      if (e.data.type === "picked") {
        setPicked({ hooks: e.data.hooks ?? [], scope: e.data.scope ?? null });
        setPicking(false);
      } else if (e.data.type === "pick-stopped") setPicking(false);
      else if (e.data.type === "ready" && pickingRef.current) toPreview(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewOrigin, toPreview]);
  // Leaving the tab (or the page) stops it.
  useEffect(() => () => toPreview(false), [toPreview]);
  useEffect(() => {
    if (!active && pickingRef.current) {
      setPicking(false);
      toPreview(false);
    }
  }, [active, toPreview]);

  const startPicking = () => {
    setPicked(null);
    setPicking(true);
    toPreview(true);
  };
  const stopPicking = () => {
    setPicking(false);
    toPreview(false);
  };

  /** Add a rule at the end of the CSS, ready to fill in. */
  const insert = (rule: string) => setCss((c) => `${c.trimEnd()}${c.trim() ? "\n\n" : ""}${rule}\n`);

  useEffect(() => {
    Promise.all([getBranding(projectId), getBrandingSchema()])
      .then(([b, slots]) => {
        setAllowed(b.custom_css_allowed !== false);
        const text = (b.custom_css as string) || "";
        setSaved(text);
        setCss(text);
        const labels = Object.fromEntries((slots as FileSlot[]).map((s) => [s.key, s.label]));
        setImages(
          Object.entries(b.files || {}).flatMap(([key, f]) =>
            (f.urls || []).map((url, i, all) => ({
              label: all.length > 1 ? `${labels[key] ?? key} ${i + 1}` : labels[key] ?? key,
              url,
            }))
          )
        );
      })
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const b = await patchBranding(projectId, { custom_css: css });
      const text = (b.custom_css as string) || "";
      setSaved(text);
      setCss(text);
      onSaved?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const status = allowed === false ? "Paid plans" : saved.trim() ? "On" : "None";

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6">Custom CSS</Typography>
        <Typography variant="caption" color="text.secondary">
          {status}
        </Typography>
      </Stack>
      <Box>
        {allowed === null && !error ? (
          <CircularProgress size={20} />
        ) : allowed === false ? (
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Style the app and the embedded recorder with CSS of your own, beyond the colors,
              font and style choices in Colors &amp; Fonts. Comes with a paid plan.
            </Typography>
            <Button variant="outlined" component={RouterLink} to="/plan">
              See plans
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              CSS of your own, over the app and the embedded recorder. Use the{" "}
              <code>rw-</code> classes below: they stay the same from update to update, where the
              app&apos;s other class names change. It shows in the preview when saved, and on the
              live site when you update it. Fonts are the ones in Colors &amp; Fonts; images, the
              project&apos;s own (below) — nothing can be loaded from elsewhere. The legal agreement and the
              test site&apos;s banner can be restyled but stay visible.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              value={css}
              onChange={(e) => setCss(e.target.value)}
              multiline
              minRows={8}
              maxRows={30}
              placeholder={EXAMPLE}
              fullWidth
              spellCheck={false}
              InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                onClick={save}
                disabled={saving || css === saved}
                startIcon={saving ? <CircularProgress size={16} /> : undefined}
              >
                Save CSS
              </Button>
              {css !== saved && (
                <Button onClick={() => setCss(saved)} disabled={saving}>
                  Discard changes
                </Button>
              )}
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                What&apos;s it called?
              </Typography>
              {picking ? (
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={stopPicking}>
                      Stop
                    </Button>
                  }
                >
                  Point at a part of the preview, then click it. (Esc stops.)
                </Alert>
              ) : (
                <Button variant="outlined" size="small" onClick={startPicking}>
                  Pick an element in the preview
                </Button>
              )}
              {picked && <PickedResult picked={picked} onInsert={insert} />}
            </Box>

            <Accordion disableGutters variant="outlined" sx={{ "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Examples</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {EXAMPLES.map((ex) => {
                    const text = ex.css(images[0]?.url);
                    return (
                      <Box key={ex.title}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">{ex.title}</Typography>
                          <Button size="small" onClick={() => insert(text)}>
                            Insert
                          </Button>
                        </Stack>
                        <Box
                          component="pre"
                          sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, fontSize: 12, overflowX: "auto" }}
                        >
                          {text}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                The project&apos;s images
              </Typography>
              {images.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None yet: upload them in Images &amp; Audio.
                </Typography>
              ) : (
                <Table size="small">
                  <TableBody>
                    {images.map(({ label, url }) => {
                      const snippet = `url("${url}")`;
                      return (
                        <TableRow key={url}>
                          <TableCell sx={{ whiteSpace: "nowrap", width: "1%" }}>{label}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                            {url}
                          </TableCell>
                          <TableCell sx={{ width: "1%" }}>
                            <Tooltip title={copied === snippet ? "Copied" : `Copy ${snippet.slice(0, 12)}…`}>
                              <IconButton size="small" onClick={() => copy(snippet)} aria-label={`Copy url() for ${label}`}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>

            <Accordion disableGutters variant="outlined" sx={{ "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">The rw- classes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  On the page&apos;s <code>&lt;html&gt;</code>, to scope a rule — e.g.{" "}
                  <code>html.rw-embed .rw-recording</code>:
                </Typography>
                <HookTable hooks={HOOKS.filter((h) => h.scope)} onCopy={copy} copied={copied} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  On the parts of the app:
                </Typography>
                <HookTable hooks={HOOKS.filter((h) => !h.scope)} onCopy={copy} copied={copied} />
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

/** What was clicked: its hooks, closest first, and a rule to start from. */
const PickedResult: React.FC<{ picked: Picked; onInsert: (rule: string) => void }> = ({ picked, onInsert }) => {
  const where = (name: string) => HOOKS.find((h) => h.name === name)?.where;
  if (picked.hooks.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        That part has no rw- class yet, nor anything around it. Tell Roundware which part it was,
        and a class can be added.
      </Alert>
    );
  }
  const [closest, ...outer] = picked.hooks;
  const scope = picked.scope ? `html.${picked.scope} ` : "";
  const rule = `${scope}.${closest} {\n  \n}`;
  return (
    <Box sx={{ mt: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Typography variant="body2">
        <Box component="code" sx={{ fontWeight: 700 }}>
          .{closest}
        </Box>
        {where(closest) ? ` — ${where(closest)}` : ""}
      </Typography>
      {outer.length > 0 && (
        <Typography variant="caption" color="text.secondary" display="block">
          Inside: {outer.map((h) => `.${h}`).join(", ")}
        </Typography>
      )}
      <Box component="pre" sx={{ my: 1, p: 1, bgcolor: "action.hover", borderRadius: 1, fontSize: 12 }}>
        {rule}
      </Box>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={() => onInsert(rule)}>
          Insert this rule
        </Button>
        {scope && (
          <Button size="small" onClick={() => onInsert(`.${closest} {\n  \n}`)}>
            On every page
          </Button>
        )}
      </Stack>
      {picked.scope && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          <code>html.{picked.scope}</code> keeps it to this{" "}
          {picked.scope === "rw-embed" ? "embedded recorder" : "page"}.
        </Typography>
      )}
    </Box>
  );
};

const HookTable: React.FC<{ hooks: Hook[]; onCopy: (t: string) => void; copied: string | null }> = ({
  hooks,
  onCopy,
  copied,
}) => (
  <Table size="small">
    <TableBody>
      {hooks.map((h) => (
        <TableRow key={h.name}>
          <TableCell sx={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap", width: "1%" }}>
            <Tooltip title={copied === `.${h.name}` ? "Copied" : "Copy"}>
              <Box component="span" sx={{ cursor: "pointer" }} onClick={() => onCopy(`.${h.name}`)}>
                .{h.name}
              </Box>
            </Tooltip>
          </TableCell>
          <TableCell sx={{ fontSize: 13 }}>{h.where}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default CustomCssPanel;
