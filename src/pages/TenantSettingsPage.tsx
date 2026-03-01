import { Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { usePermissions, Title } from "react-admin";
import { apiFetcher } from "../roundwareDataProvider/tokenAuthProvider";

interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  member_count: number;
  your_role: string;
}

const TenantSettingsPage = (): JSX.Element => {
  const { permissions } = usePermissions();
  const canEdit = permissions?.role === "owner" || permissions?.role === "superuser";

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    try {
      const { json } = await apiFetcher("/tenant/");
      const t = json as unknown as TenantInfo;
      setTenant(t);
      setName(t.name);
      setDescription(t.description || "");
      setLogoUrl(t.logo_url || "");
    } catch {
      setError("Failed to load tenant settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    try {
      const { json } = await apiFetcher("/tenant/", {
        method: "PATCH",
        body: JSON.stringify({ name, description, logo_url: logoUrl }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      const t = json as unknown as TenantInfo;
      setTenant(t);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save settings.";
      setError(msg);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 2 }}>
      <Title title="Tenant Settings" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Settings saved.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Organization Settings"
          subheader={
            tenant && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip label={`Slug: ${tenant.slug}`} size="small" variant="outlined" />
                <Chip label={`${tenant.member_count} member${tenant.member_count !== 1 ? "s" : ""}`} size="small" variant="outlined" />
                <Chip label={`Your role: ${tenant.your_role}`} size="small" color="primary" />
              </Stack>
            )
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              disabled={!canEdit}
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!canEdit}
            />
            <TextField
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              fullWidth
              disabled={!canEdit}
              placeholder="https://example.com/logo.png"
            />
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!name.trim()}
              >
                Save Settings
              </Button>
            )}
            {!canEdit && (
              <Typography variant="body2" color="text.secondary">
                Only the organization owner can edit these settings.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TenantSettingsPage;
