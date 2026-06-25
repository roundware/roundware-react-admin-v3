import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import {
  DeploymentState,
  SubdomainCheck,
  checkSubdomain,
  deployProject,
  errMessage,
  getDeployment,
  undeployProject,
} from "./api";

interface Props {
  projectId: number;
  onChange?: () => void;
}

const BASE_DOMAIN = "roundware.com";

const DeployCard: React.FC<Props> = ({ projectId, onChange }) => {
  const [state, setState] = useState<DeploymentState | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [check, setCheck] = useState<SubdomainCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current deployment state
  useEffect(() => {
    let cancelled = false;
    getDeployment(projectId).then((s) => {
      if (cancelled) return;
      setState(s);
      if (s.subdomain) setSubdomain(s.subdomain);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Debounced availability check
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const value = subdomain.trim().toLowerCase();
    setCheck(null);
    if (!value || value === state?.subdomain) return;
    setChecking(true);
    debounce.current = setTimeout(async () => {
      try {
        setCheck(await checkSubdomain(value));
      } catch {
        setCheck(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [subdomain, state?.subdomain]);

  const value = subdomain.trim().toLowerCase();
  const isCurrent = state?.deployed && value === state.subdomain;
  const canDeploy = !!value && !checking && (isCurrent || check?.available === true);

  const handleDeploy = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await deployProject(projectId, value);
      setState(s);
      setCheck(null);
      onChange?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setBusy(true);
    setError(null);
    try {
      await undeployProject(projectId);
      setState({ deployed: false, subdomain: null, hostname: null, url: null });
      onChange?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reasonText: Record<string, string> = {
    taken: "That subdomain is already taken.",
    reserved: "That subdomain is reserved.",
    invalid_format: "Use 3–63 lowercase letters, numbers, or hyphens.",
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <PublicIcon color="primary" />
          <Typography variant="h6">Deploy</Typography>
          {state?.deployed ? (
            <Chip label="Published" color="success" size="small" />
          ) : (
            <Chip label="Not published" size="small" />
          )}
        </Stack>

        {state?.deployed && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Published to <strong>{state.hostname}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Becomes publicly reachable once the platform domain &amp; hosting
              are configured (deployment phase).
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Subdomain"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          fullWidth
          size="small"
          placeholder="my-tour"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">.{BASE_DOMAIN}</InputAdornment>
            ),
          }}
          helperText={
            checking
              ? "Checking availability…"
              : isCurrent
                ? "Current address"
                : check
                  ? check.available
                    ? "Available"
                    : reasonText[check.reason ?? ""] ?? "Unavailable"
                  : "Choose your public web address"
          }
          error={check ? !check.available : false}
          color={check?.available ? "success" : undefined}
        />

        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            disabled={!canDeploy || busy}
            onClick={handleDeploy}
            startIcon={busy ? <CircularProgress size={16} /> : undefined}
          >
            {state?.deployed
              ? isCurrent
                ? "Re-deploy"
                : "Change address"
              : "Deploy"}
          </Button>
          {state?.deployed && (
            <Button color="error" variant="outlined" disabled={busy} onClick={handleUnpublish}>
              Unpublish
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DeployCard;
