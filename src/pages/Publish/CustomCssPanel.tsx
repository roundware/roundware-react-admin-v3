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
import { errMessage, FileSlot, getBranding, getBrandingSchema, patchBranding } from "./api";

interface Props {
  projectId: number;
  onSaved?: () => void;
}

interface Hook {
  name: string;
  where: string;
  scope?: boolean;
}

const HOOKS = (hooksFile as { hooks: Hook[] }).hooks;

const EXAMPLE = `/* For example: */
.rw-header { background: rgba(0, 0, 0, 0.4); }
html.rw-embed .rw-recording { border-radius: 0; }`;

/**
 * Custom CSS (server docs/029), on paid plans: the project's own CSS over
 * the app and the embedded recorder, using the stable rw- hooks. The server
 * checks it — no @import, no @font-face, url() only for the project's own
 * files — and the preview shows it as soon as it's saved.
 */
const CustomCssPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saved, setSaved] = useState("");
  const [css, setCss] = useState("");
  const [images, setImages] = useState<{ label: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
    <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Custom CSS</Typography>
          <Typography variant="caption" color="text.secondary">
            {status}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        {allowed === null && !error ? (
          <CircularProgress size={20} />
        ) : allowed === false ? (
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Style the app and the embedded recorder with CSS of your own, beyond the colors,
              font and style choices above. Comes with a paid plan.
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
              live site when you update it. Fonts are the ones above; images, the project&apos;s
              own (below) — nothing can be loaded from elsewhere. The legal agreement and the
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
                The project&apos;s images
              </Typography>
              {images.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None yet: upload them in Images &amp; audio, above.
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
      </AccordionDetails>
    </Accordion>
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
