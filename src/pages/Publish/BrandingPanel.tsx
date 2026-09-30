import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { errMessage, getBranding, patchBranding } from "./api";
import BrandingFilesPanel from "./BrandingFilesPanel";
import InfoPanelEditor from "./InfoPanelEditor";
import LookAndFeelPanel from "./LookAndFeelPanel";

interface Props {
  projectId: number;
  onSaved?: () => void;
}

const BrandingPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBranding(projectId).then((b) => {
      if (cancelled) return;
      setTitle(b.app_title || "");
      setSubtitle(b.app_subtitle || "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  // Saved from edits only. This used to be an effect on the fields, which
  // also fired when they were filled in on load — so opening this page saved
  // every field, colors included, whether or not anything was touched.
  const save = (fields: { app_title: string; app_subtitle: string }) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, fields);
        onSaved?.();
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSaving(false);
      }
    }, 600);
  };

  if (!loaded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Branding</Typography>
        {saving && <CircularProgress size={18} />}
      </Stack>

      {error && <Typography color="error" variant="body2">{error}</Typography>}

      <TextField
        label="App title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          save({ app_title: e.target.value, app_subtitle: subtitle });
        }}
        fullWidth
        size="small"
      />
      <TextField
        label="App subtitle"
        value={subtitle}
        onChange={(e) => {
          setSubtitle(e.target.value);
          save({ app_title: title, app_subtitle: e.target.value });
        }}
        fullWidth
        size="small"
      />

      <LookAndFeelPanel projectId={projectId} onSaved={onSaved} />

      <BrandingFilesPanel projectId={projectId} onSaved={onSaved} />

      <InfoPanelEditor projectId={projectId} onSaved={onSaved} />
    </Stack>
  );
};

export default BrandingPanel;
