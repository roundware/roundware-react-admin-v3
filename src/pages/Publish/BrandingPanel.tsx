import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { Branding, errMessage, getBranding, patchBranding, uploadLogo } from "./api";

interface Props {
  projectId: number;
  onSaved?: () => void;
}

const DEFAULTS = { primary: "#1976d2", secondary: "#9c27b0", background: "#ffffff" };

const BrandingPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [primary, setPrimary] = useState(DEFAULTS.primary);
  const [secondary, setSecondary] = useState(DEFAULTS.secondary);
  const [background, setBackground] = useState(DEFAULTS.background);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getBranding(projectId).then((b) => {
      if (cancelled) return;
      setBranding(b);
      setTitle(b.app_title || "");
      setSubtitle(b.app_subtitle || "");
      const p = b.theme_json?.palette || {};
      setPrimary(p.primary || DEFAULTS.primary);
      setSecondary(p.secondary || DEFAULTS.secondary);
      setBackground(p.background || DEFAULTS.background);
      setLogoUrl(b.logo_url);
      loaded.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Debounced auto-save when any field changes (after initial load)
  useEffect(() => {
    if (!loaded.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, {
          app_title: title,
          app_subtitle: subtitle,
          theme_json: { palette: { primary, secondary, background } },
        });
        onSaved?.();
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [projectId, title, subtitle, primary, secondary, background, onSaved]);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const res = await uploadLogo(projectId, file);
      setLogoUrl(res.logo_url);
      onSaved?.();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!branding) {
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

      {/* Logo */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={logoUrl ?? undefined} variant="rounded" sx={{ width: 56, height: 56 }}>
          ?
        </Avatar>
        <Button component="label" variant="outlined" startIcon={<UploadIcon />} size="small">
          Upload logo
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            onChange={handleLogo}
          />
        </Button>
      </Stack>

      <TextField
        label="App title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        size="small"
      />
      <TextField
        label="App subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        fullWidth
        size="small"
      />

      <Typography variant="subtitle2">Colors</Typography>
      <Stack direction="row" spacing={2}>
        <ColorField label="Primary" value={primary} onChange={setPrimary} />
        <ColorField label="Accent" value={secondary} onChange={setSecondary} />
        <ColorField label="Background" value={background} onChange={setBackground} />
      </Stack>
    </Stack>
  );
};

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <Box sx={{ textAlign: "center" }}>
    <Typography variant="caption" display="block" color="text.secondary">
      {label}
    </Typography>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 44, height: 36, border: "none", background: "none", cursor: "pointer" }}
    />
  </Box>
);

export default BrandingPanel;
