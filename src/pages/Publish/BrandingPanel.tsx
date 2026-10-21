import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import AppStartPanel from "./AppStartPanel";
import BrandingFilesPanel from "./BrandingFilesPanel";
import CustomCssPanel from "./CustomCssPanel";
import DialogCopyEditor from "./DialogCopyEditor";
import InfoPanelEditor from "./InfoPanelEditor";
import LookAndFeelPanel from "./LookAndFeelPanel";
import MapAppearanceEditor from "./MapAppearanceEditor";
import { BrandingTextField, BrandingTextProvider, LanguageSwitch, useBrandingText } from "./brandingText";

/** Look & Feel's tabs, in the order a project is set up. */
export const LOOK_TABS = [
  { key: "start", label: "App Start Flow" },
  { key: "copy", label: "Copy" },
  { key: "colors", label: "Colors & Fonts" },
  { key: "media", label: "Images & Audio" },
  { key: "map", label: "Map" },
  { key: "css", label: "Custom CSS" },
] as const;
export type LookTab = (typeof LOOK_TABS)[number]["key"];

/** The tabs with text or files per language: the language picker shows on these. */
const PER_LANGUAGE: LookTab[] = ["start", "copy", "media"];

interface Props {
  projectId: number;
  tab: LookTab;
  onSaved?: () => void;
  /** Open the preview on a path (App start's screens). */
  onPreview?: (path: string) => void;
  /** Map appearance reloads its speaker images when branding is saved. */
  brandingVersion?: number;
}

/**
 * Look & Feel's editing side, one tab at a time. A tab is mounted the first
 * time it's opened and then kept, hidden, so switching never loses what's
 * being edited (unsaved Custom CSS, say). Its text — title, subtitle, Home's
 * labels, the info panel — is edited in the language picked at the top, and
 * so is the welcome audio (server docs/017).
 */
const BrandingPanel: React.FC<Props> = ({ projectId, tab, onSaved, onPreview, brandingVersion }) => {
  const [opened, setOpened] = useState<Set<LookTab>>(() => new Set([tab]));
  useEffect(() => {
    setOpened((o) => (o.has(tab) ? o : new Set(o).add(tab)));
  }, [tab]);

  const panel = (key: LookTab, body: React.ReactNode) =>
    opened.has(key) ? (
      <Box key={key} role="tabpanel" hidden={tab !== key}>
        {body}
      </Box>
    ) : null;

  return (
    <BrandingTextProvider projectId={projectId} onSaved={onSaved}>
      <Stack spacing={2.5} sx={{ position: "relative" }}>
        <Status />
        {PER_LANGUAGE.includes(tab) && <LanguageSwitch />}

        {panel("start", <AppStartPanel projectId={projectId} onSaved={onSaved} onPreview={onPreview} />)}

        {panel(
          "copy",
          <Stack spacing={2.5}>
            <Typography variant="h6">Copy</Typography>
            <BrandingTextField field="app_title" label="App title" />
            <BrandingTextField field="app_subtitle" label="App subtitle" />
            <BrandingTextField
              field="app_byline"
              label="Byline"
              multiline
              minRows={2}
              helperText="Under the subtitle on the intro screen — credits, a date, a place."
            />
            <BrandingTextField
              field="intro_button_text"
              label="Intro button"
              helperText="The button that starts the experience. Leave empty for the app's own (ENTER in English), in each language."
            />
            <InfoPanelEditor />
            <DialogCopyEditor />
          </Stack>
        )}

        {panel("colors", <LookAndFeelPanel projectId={projectId} onSaved={onSaved} />)}

        {panel("media", <BrandingFilesPanel projectId={projectId} onSaved={onSaved} />)}

        {panel(
          "map",
          <MapAppearanceEditor projectId={projectId} onSaved={onSaved} brandingVersion={brandingVersion} />
        )}

        {panel("css", <CustomCssPanel projectId={projectId} onSaved={onSaved} active={tab === "css"} />)}
      </Stack>
    </BrandingTextProvider>
  );
};

/** A text being saved (top right, so nothing moves), or a save that failed. */
const Status = () => {
  const ctx = useBrandingText();
  if (ctx?.error) return <Alert severity="error">{ctx.error}</Alert>;
  if (!ctx?.saving) return null;
  return (
    <Box sx={{ position: "absolute", top: 0, right: 0, m: "0 !important" }} title="Saving">
      <CircularProgress size={16} />
    </Box>
  );
};

export default BrandingPanel;
