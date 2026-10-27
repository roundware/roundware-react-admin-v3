// ---------------------------------------------------------------------------
// Your data, on the Organization settings page (2026-10-27): what the terms
// promise. Export everything (the organization or one project) in open
// formats; import an export back in as new projects; close the account
// (owners); delete your own account. Server: exports, imports, closure and
// users/me routes.
// ---------------------------------------------------------------------------
import { Download, Upload } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLogout } from "react-admin";
import { useProjects } from "../context/ProjectsContext";
import { apiFetcher } from "../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./Publish/api";

const serverUrl = () => String(import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

/** Export: one ZIP, the whole organization or one project. */
export const ExportCard: React.FC = () => {
  const { projectsList } = useProjects();
  const [scope, setScope] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const { json } = await apiFetcher("/exports/", {
        method: "POST",
        body: JSON.stringify({ project_id: scope === "all" ? null : Number(scope) }),
      });
      // A plain download: the link carries its own short-lived permission.
      window.location.href = serverUrl() + json.url;
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setTimeout(() => setBusy(false), 3000);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Export" subheader="Everything, in formats any software can read" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          One ZIP file: contributions and participants as spreadsheets (CSV), every setting and record as JSON, and
          every audio file, photo and image as stored. It can be imported back into Roundware, here or on another
          server. Contact details are included, so keep it safe.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <TextField select size="small" label="What to export" value={scope} onChange={(e) => setScope(e.target.value)} sx={{ minWidth: 280 }}>
            <MenuItem value="all">The whole organization (all projects)</MenuItem>
            {(projectsList ?? []).map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<Download />} onClick={run} disabled={busy}>
            {busy ? "Starting…" : "Export"}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          With many recordings it's large and takes a while; if the download stops, export again (one project at a time
          is smaller).
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

interface ImportReport {
  projects: { id: number; name: string }[];
  files: number;
  left_out: string[];
}

/** Import: an export's projects, as new projects in this organization. */
export const ImportCard: React.FC = () => {
  const { refetch } = useProjects();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ImportReport | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const { json } = await apiFetcher("/imports/", { method: "POST", body });
      setDone(json as ImportReport);
      refetch?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Import" subheader="Bring an export back in" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a Roundware export (ZIP). Its projects come in as new projects, with their contributions, settings and
          files; nothing here is changed or replaced. They start unpublished, so give them a web address when you're
          ready. Team members and the plan aren't imported.
        </Typography>
        <input
          ref={input}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <Button variant="outlined" startIcon={<Upload />} onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Importing… (this can take a while)" : "Choose an export…"}
        </Button>
        {done && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Imported {done.projects.map((p) => `"${p.name}"`).join(", ")}, with {done.files} files.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

interface Closure {
  closing: boolean;
  closed: boolean;
  closing_at: string | null;
  delete_after: string | null;
  keep_days: number;
  would_take_effect?: string;
}

/** Close the organization's account (owners), or reopen it. */
export const CloseAccountCard: React.FC<{ orgName: string; isOwner: boolean }> = ({ orgName, isOwner }) => {
  const [state, setState] = useState<Closure | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetcher("/closure/")
      .then(({ json }) => setState(json as Closure))
      .catch(() => setState(null));
  }, []);
  useEffect(load, [load]);

  const act = async (path: string, body?: object) => {
    setBusy(true);
    setError(null);
    try {
      const { json } = await apiFetcher(`/closure/${path}`, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      setState(json as Closure);
      setOpen(false);
      setTyped("");
      load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  const later = state.would_take_effect && new Date(state.would_take_effect).getTime() > Date.now() + 60_000;

  return (
    <Card sx={{ mt: 2, borderColor: "error.light" }} variant="outlined">
      <CardHeader title="Close this account" />
      <CardContent>
        {state.closing ? (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {state.closed
                ? `This account is closed: its projects are offline, and only owners can sign in.`
                : `This account closes on ${day(state.closing_at)}, at the end of the period already paid for.`}{" "}
              Everything is deleted for good on <strong>{day(state.delete_after)}</strong>. Export anything you want to keep
              before then.
            </Alert>
            {isOwner && (
              <Button variant="contained" onClick={() => act("reopen/")} disabled={busy}>
                Reopen the account
              </Button>
            )}
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {later
                ? `Your projects stay up until ${day(state.would_take_effect)}, the end of the period already paid for. Then they go offline`
                : "Your projects go offline right away"}
              , and only owners can sign in, to export or reopen. After {state.keep_days} days everything is deleted for
              good: projects, contributions and every file. You can reopen any time before then.
            </Typography>
            {isOwner ? (
              <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
                Close the account…
              </Button>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Only owners can close the account.
              </Typography>
            )}
          </>
        )}
        {error && !open && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close the account for {orgName}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {later ? `On ${day(state.would_take_effect)}` : "Right away"}, its projects go offline and only owners can sign
            in. Everything is deleted for good {state.keep_days} days after that, unless you reopen it. The team is told by
            email.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Type the organization's name to confirm"
            placeholder={orgName}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={busy || typed.trim().toLowerCase() !== orgName.trim().toLowerCase()}
            onClick={() => act("close/", { confirm_name: typed })}
          >
            Close the account
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

/** Delete your own account. */
export const DeleteMyAccountCard: React.FC = () => {
  const logout = useLogout();
  const me = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null") as { email?: string } | null;
    } catch {
      return null;
    }
  })();
  const email = me?.email ?? "";
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiFetcher("/users/me/", { method: "DELETE", body: JSON.stringify({ confirm_email: typed }) });
      await logout();
    } catch (e) {
      setError(errMessage(e));
      setBusy(false);
    }
  };

  return (
    <Card sx={{ mt: 2, mb: 4 }} variant="outlined">
      <CardHeader title="Delete your account" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your sign-in and your place on every team you belong to. The projects and contributions you worked on stay with
          their organizations. If you're the only owner of an organization, make someone else an owner, or close its
          account, first.
        </Typography>
        <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
          Delete my account…
        </Button>
      </CardContent>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This can't be undone. You'll be signed out.
          </Typography>
          <TextField fullWidth size="small" label="Type your email address to confirm" placeholder={email} value={typed} onChange={(e) => setTyped(e.target.value)} />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={busy || !typed.trim() || (!!email && typed.trim().toLowerCase() !== email.toLowerCase())} onClick={run}>
            Delete my account
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
