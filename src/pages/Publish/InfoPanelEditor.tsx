import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Branding, errMessage, getBranding, patchBranding } from "./api";

/**
 * The tabs of the participant-facing info panel.
 *
 * These are HTML, stored on the project's branding record — the fields have
 * existed since Phase 4, so nothing here needs a migration. The web app builds
 * one tab per non-empty field and skips the rest, which is why leaving a box
 * empty hides its tab rather than showing an empty one.
 *
 * Until now the panel showed four hardcoded tabs of Invisible Choir's copy to
 * every project, because these fields had no editor and, for three of them, no
 * route out of the API either.
 */

interface Props {
  projectId: number;
  onSaved?: () => void;
}

const FIELDS: Array<{ key: keyof Branding; label: string; hint: string }> = [
  {
    key: "about_html",
    label: "About",
    hint: "What the project is, and why someone should take part.",
  },
  {
    key: "credits_html",
    label: "Credits",
    hint: "Who made it. Often a list — <ul><li>Name — role</li></ul>.",
  },
  {
    key: "exhibition_html",
    label: "Exhibition",
    hint: "Where and when it can be experienced, if that applies.",
  },
  {
    key: "artists_html",
    label: "Artists",
    hint: "Longer biographies, if the credits list is not enough.",
  },
];

const InfoPanelEditor: React.FC<Props> = ({ projectId, onSaved }) => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The values as loaded. Saving is for edits: without this check the save
  // effect fired on load too, re-saving what had just been read and
  // reloading the preview every time the page opened.
  const asLoaded = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBranding(projectId)
      .then((b) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const f of FIELDS) next[f.key as string] = (b[f.key] as string) || "";
        asLoaded.current = next;
        setValues(next);
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Debounced auto-save, matching the rest of this page.
  useEffect(() => {
    if (!values || values === asLoaded.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, values);
        onSaved?.();
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [projectId, values, onSaved]);

  if (error && !values) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }
  if (!values) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  const filled = FIELDS.filter((f) => values[f.key as string]?.trim()).length;

  return (
    <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Info panel</Typography>
          <Typography variant="caption" color="text.secondary">
            {filled === 0
              ? "no tabs — participants see a generated About"
              : `${filled} tab${filled === 1 ? "" : "s"}`}
          </Typography>
          {saving && <CircularProgress size={14} />}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Each box becomes a tab in the participant&apos;s info panel. Leave one
            empty and its tab is hidden. HTML is allowed — headings, paragraphs,
            lists and links.
          </Typography>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          {FIELDS.map((f) => (
            <TextField
              key={f.key as string}
              label={f.label}
              value={values[f.key as string] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v!, [f.key as string]: e.target.value }))
              }
              helperText={f.hint}
              multiline
              minRows={3}
              fullWidth
              size="small"
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default InfoPanelEditor;
