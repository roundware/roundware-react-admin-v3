import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { BrandingTextField, useBrandingText } from "./brandingText";

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

const FIELDS: Array<{ key: string; label: string; hint: string }> = [
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

/** Edited in the language picked at the top of Look & Feel (brandingText). */
const InfoPanelEditor: React.FC = () => {
  const ctx = useBrandingText();
  if (!ctx) return null;
  // Counted in the default language: a tab exists when it has text there.
  const filled =
    FIELDS.filter((f) => ctx.get(f.key, ctx.defaultCode).trim()).length +
    asTabs(ctx.getValue("info_tabs_json", ctx.defaultCode)).length;

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
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Each box becomes a tab in the participant&apos;s info panel. Leave one
            empty and its tab is hidden. HTML is allowed — headings, paragraphs,
            lists and links.
          </Typography>
          {FIELDS.map((f) => (
            <BrandingTextField
              key={f.key}
              field={f.key}
              label={f.label}
              helperText={f.hint}
              multiline
              minRows={3}
            />
          ))}
          <MoreTabs />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

interface InfoTab {
  label: string;
  html: string;
}

const asTabs = (v: unknown): InfoTab[] =>
  Array.isArray(v) ? v.filter((t) => t && typeof t === "object").map((t) => ({ label: t.label ?? "", html: t.html ?? "" })) : [];

/**
 * Tabs of the project's own, after the four above — any label, any HTML
 * (info_tabs_json). Per language like everything here: a language with no
 * tabs of its own shows the default language's.
 */
const MoreTabs: React.FC = () => {
  const ctx = useBrandingText();
  if (!ctx) return null;
  const isDefault = !ctx.language || ctx.language === ctx.defaultCode;
  const tabs = asTabs(ctx.getValue("info_tabs_json"));
  const defaultTabs = asTabs(ctx.getValue("info_tabs_json", ctx.defaultCode));
  const defaultName = ctx.languages.find((l) => l.code === ctx.defaultCode)?.name;
  const save = (next: InfoTab[]) => ctx.set("info_tabs_json", next);
  const update = (i: number, patch: Partial<InfoTab>) => save(tabs.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">More tabs</Typography>
      {!isDefault && !tabs.length && defaultTabs.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Not translated: participants see the {defaultName} tabs ({defaultTabs.map((t) => t.label).join(", ")}).
          </Typography>
          <Button size="small" onClick={() => save(defaultTabs)}>
            Translate them
          </Button>
        </Stack>
      )}
      {tabs.map((tab, i) => (
        <Stack key={i} spacing={1} sx={{ pl: 1.5, borderLeft: 2, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Tab label"
              value={tab.label}
              onChange={(e) => update(i, { label: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
            <IconButton aria-label="Remove tab" onClick={() => save(tabs.filter((_, j) => j !== i))}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField
            label="Content (HTML)"
            value={tab.html}
            onChange={(e) => update(i, { html: e.target.value })}
            multiline
            minRows={3}
            size="small"
            fullWidth
          />
        </Stack>
      ))}
      <Box>
        <Button size="small" startIcon={<AddIcon />} onClick={() => save([...tabs, { label: "", html: "" }])}>
          Add a tab
        </Button>
      </Box>
    </Stack>
  );
};

export default InfoPanelEditor;
