import React from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import AppStartPanel from "./AppStartPanel";
import BrandingFilesPanel from "./BrandingFilesPanel";
import CustomCssPanel from "./CustomCssPanel";
import DialogCopyEditor from "./DialogCopyEditor";
import InfoPanelEditor from "./InfoPanelEditor";
import LookAndFeelPanel from "./LookAndFeelPanel";
import { BrandingTextField, BrandingTextProvider, LanguageSwitch, useBrandingText } from "./brandingText";

interface Props {
  projectId: number;
  onSaved?: () => void;
  /** Open the preview on a path (App start's screens). */
  onPreview?: (path: string) => void;
}

/**
 * Look & Feel's left column. Its text — title, subtitle, byline, button,
 * info panel — is edited in the language picked at the top, and so is the
 * welcome audio (server docs/017).
 */
const BrandingPanel: React.FC<Props> = ({ projectId, onSaved, onPreview }) => (
  <BrandingTextProvider projectId={projectId} onSaved={onSaved}>
    <Stack spacing={2.5}>
      <Header />
      <LanguageSwitch />
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

      <AppStartPanel projectId={projectId} onSaved={onSaved} onPreview={onPreview} />

      <LookAndFeelPanel projectId={projectId} onSaved={onSaved} />

      <BrandingFilesPanel projectId={projectId} onSaved={onSaved} />

      <CustomCssPanel projectId={projectId} onSaved={onSaved} />

      <InfoPanelEditor />

      <DialogCopyEditor />
    </Stack>
  </BrandingTextProvider>
);

const Header = () => {
  const ctx = useBrandingText();
  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Branding</Typography>
        {ctx?.saving && <CircularProgress size={18} />}
      </Stack>
      {ctx?.error && (
        <Typography color="error" variant="body2">
          {ctx.error}
        </Typography>
      )}
    </>
  );
};

export default BrandingPanel;
