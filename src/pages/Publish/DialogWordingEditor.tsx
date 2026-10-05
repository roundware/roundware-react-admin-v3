import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import React from "react";
import { BrandingTextField, useBrandingText } from "./brandingText";

/**
 * The project's own wording for the app's system dialogs.
 *
 * The app has built-in wording for these in every language it supports
 * (server docs/017, phase 2); anything written here replaces it, in the
 * language being edited. Left empty, participants see the built-in wording.
 */
const FIELDS: Array<{ key: string; label: string; multiline?: boolean }> = [
  { key: "mic_permission_title", label: "Microphone request — title" },
  { key: "mic_permission_body", label: "Microphone request — message", multiline: true },
  { key: "location_permission_title", label: "Location request — title" },
  { key: "location_permission_body", label: "Location request — message", multiline: true },
  { key: "audio_required_title", label: "Sound needed — title" },
  { key: "audio_required_body", label: "Sound needed — message", multiline: true },
  {
    key: "consent_fallback_text",
    label: "Consent sentence (looping recordings, when there's no legal agreement)",
    multiline: true,
  },
];

const DialogWordingEditor: React.FC = () => {
  const ctx = useBrandingText();
  if (!ctx) return null;
  const custom = FIELDS.filter((f) => ctx.get(f.key, ctx.defaultCode).trim()).length;

  return (
    <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Dialog wording</Typography>
          <Typography variant="caption" color="text.secondary">
            {custom === 0 ? "Roundware's wording" : `${custom} of your own`}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            The app asks for the microphone and location, and says when sound is needed, in
            Roundware&apos;s own wording, in each language it supports. Write your own here to
            replace it; leave a box empty to keep Roundware&apos;s.
          </Typography>
          {FIELDS.map((f) => (
            <BrandingTextField
              key={f.key}
              field={f.key}
              label={f.label}
              multiline={f.multiline}
              minRows={f.multiline ? 2 : undefined}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default DialogWordingEditor;
