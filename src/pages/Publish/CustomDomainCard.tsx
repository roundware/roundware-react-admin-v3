import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { Link as RouterLink } from "react-router-dom";
import {
  CustomDomainState,
  checkCustomDomain,
  errMessage,
  getCustomDomain,
  removeCustomDomain,
  setCustomDomain,
} from "./api";

interface Props {
  projectId: number;
  /** The live site's address changed: the other cards show the new one. */
  onChange?: () => void;
}

/** The part of the address before the domain, as most DNS hosts ask for
 *  it: "stories" for stories.mypodcast.org. A guess for long suffixes
 *  (.co.uk), so the full name is shown too. */
const recordName = (hostname: string) => {
  const labels = hostname.split(".");
  const domainLabels = labels.length > 3 && labels[labels.length - 1].length === 2 ? 3 : 2;
  return labels.slice(0, labels.length - domainLabels).join(".") || hostname;
};

/**
 * A project's own address (server docs/028): a subdomain of the author's
 * domain, pointed here with one CNAME record. Paid plans; one at a time.
 */
const CustomDomainCard: React.FC<Props> = ({ projectId, onChange }) => {
  const [state, setState] = useState<CustomDomainState | null>(null);
  const [typed, setTyped] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"" | "save" | "check" | "remove">("");
  const [error, setError] = useState<string | null>(null);
  const [checkedNow, setCheckedNow] = useState(false);

  useEffect(() => {
    getCustomDomain(projectId)
      .then(setState)
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

  const run = async (what: "save" | "check" | "remove", call: () => Promise<CustomDomainState | null>) => {
    setBusy(what);
    setError(null);
    try {
      const next = await call();
      const wasVerified = state?.verified;
      if (next) setState(next);
      setCheckedNow(what !== "remove");
      setEditing(false);
      if ((next?.verified ?? false) !== !!wasVerified || what === "remove") onChange?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy("");
    }
  };

  const save = () => run("save", () => setCustomDomain(projectId, typed));
  const check = () => run("check", () => checkCustomDomain(projectId));
  const remove = () =>
    run("remove", async () => {
      await removeCustomDomain(projectId);
      return state ? { ...state, hostname: null, verified: false, verified_at: null, url: null } : null;
    });

  if (!state) {
    return error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null;
  }

  const showForm = !state.hostname || editing;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <LanguageIcon color="primary" />
          <Typography variant="h6">Your own address</Typography>
          {!state.allowed ? (
            <Chip label="Paid plans" size="small" />
          ) : state.hostname ? (
            state.verified ? (
              <Chip label="Connected" color="success" size="small" />
            ) : (
              <Chip label="Waiting for DNS" color="warning" size="small" />
            )
          ) : null}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use an address of your own as well, like <strong>stories.mypodcast.org</strong>: a
          subdomain of a domain you have. The live site answers there too; the Roundware
          address keeps working, and the test site stays on it.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!state.allowed ? (
          <Button variant="outlined" component={RouterLink} to="/plan">
            See plans
          </Button>
        ) : (
          <Stack spacing={2}>
            {state.hostname && !editing && (
              <>
                {state.verified ? (
                  <Alert severity="success">
                    Connected:{" "}
                    <Link href={state.url ?? `https://${state.hostname}`} target="_blank" rel="noopener">
                      <strong>{state.hostname}</strong>
                    </Link>
                    . The first visit can take a few seconds while its security certificate is
                    made.
                  </Alert>
                ) : (
                  <Alert severity={checkedNow ? "warning" : "info"}>
                    {checkedNow
                      ? `${state.hostname} doesn't point here yet. DNS changes can take a few minutes — sometimes a few hours — to reach everywhere.`
                      : `Add the record below at your domain's DNS provider, then check.`}
                  </Alert>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    The DNS record
                  </Typography>
                  <Table size="small" sx={{ maxWidth: 560 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Target (or value)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>CNAME</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{recordName(state.hostname)}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{state.target}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Some providers want the full name, <code>{state.hostname}</code>, instead. On
                    Cloudflare, set the record to <strong>DNS only</strong> (the grey cloud), or the
                    address can't get its certificate.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant={state.verified ? "outlined" : "contained"}
                    onClick={check}
                    disabled={!!busy}
                    startIcon={busy === "check" ? <CircularProgress size={16} /> : undefined}
                  >
                    Check now
                  </Button>
                  <Button
                    onClick={() => {
                      setTyped(state.hostname ?? "");
                      setEditing(true);
                    }}
                    disabled={!!busy}
                  >
                    Change
                  </Button>
                  <Button color="error" onClick={remove} disabled={!!busy}>
                    Remove
                  </Button>
                </Stack>
              </>
            )}

            {showForm && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
                <TextField
                  label="Your address"
                  placeholder="stories.mypodcast.org"
                  size="small"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typed.trim()) save();
                  }}
                  helperText="A subdomain of your own domain — not the domain itself."
                  sx={{ minWidth: 320 }}
                />
                <Button
                  variant="contained"
                  onClick={save}
                  disabled={!typed.trim() || !!busy}
                  startIcon={busy === "save" ? <CircularProgress size={16} /> : undefined}
                >
                  {state.hostname ? "Use this address" : "Connect"}
                </Button>
                {editing && (
                  <Button onClick={() => setEditing(false)} disabled={!!busy}>
                    Cancel
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomDomainCard;
