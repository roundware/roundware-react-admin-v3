import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
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
  const filled = FIELDS.filter((f) => ctx.get(f.key, ctx.defaultCode).trim()).length;

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
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default InfoPanelEditor;
