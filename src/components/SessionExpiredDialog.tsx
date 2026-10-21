import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import tokenAuthProvider from "../context/AuthProvider";
import {
  accessTokenExpired,
  isSessionEnded,
  SESSION_ENDED,
  sessionEnded,
  sessionRenewed,
  tokenTimes,
} from "../roundwareDataProvider/tokenAuthProvider";

const SESSION_RENEWED = "roundware-session-renewed";
// setTimeout's longest wait (about 24.8 days).
const MAX_WAIT = 2 ** 31 - 1;

const storedUser = (): { id?: number; email?: string } | null => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const lastsFor = (ms: number | null) => {
  if (!ms) return null;
  const hours = Math.round(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const minutes = Math.max(1, Math.round(ms / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

/**
 * "Your session has timed out" (tokenAuthProvider's sessionEnded): over the
 * page, when the sign-in runs out — at its time, on coming back to the tab,
 * or when the server refuses a request. Signing in again here keeps the page
 * as it was, unsaved changes and all; Sign out goes to Sign In.
 */
const SessionExpiredDialog: React.FC = () => {
  const [open, setOpen] = useState(isSessionEnded);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lasts, setLasts] = useState<string | null>(null);

  // Watch the clock: a timer for the sign-in's end, and a look whenever the
  // tab comes back (a sleeping laptop's timers run late).
  useEffect(() => {
    let timer: number | undefined;
    const check = () => {
      if (accessTokenExpired()) sessionEnded();
      else schedule();
    };
    const schedule = () => {
      window.clearTimeout(timer);
      const t = tokenTimes();
      if (!t || isSessionEnded()) return;
      timer = window.setTimeout(check, Math.min(Math.max(t.expiresAt - Date.now(), 0) + 1000, MAX_WAIT));
    };
    const onVisible = () => document.visibilityState === "visible" && check();
    schedule();
    window.addEventListener("roundware-auth-change", schedule);
    window.addEventListener(SESSION_RENEWED, schedule);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("roundware-auth-change", schedule);
      window.removeEventListener(SESSION_RENEWED, schedule);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const onEnded = () => {
      setEmail(storedUser()?.email ?? "");
      setLasts(lastsFor(tokenTimes()?.lasts ?? null));
      setPassword("");
      setError(null);
      setOpen(true);
    };
    if (isSessionEnded()) onEnded();
    window.addEventListener(SESSION_ENDED, onEnded);
    return () => window.removeEventListener(SESSION_ENDED, onEnded);
  }, []);

  const knownEmail = storedUser()?.email;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const before = storedUser()?.id;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/3/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.access_token) {
        setError(
          typeof json?.detail === "string" ? json.detail : "That didn't work. Check the password and try again."
        );
        return;
      }
      if (before && json.user?.id !== before) {
        // Someone else: start clean, as them.
        await tokenAuthProvider.logout(undefined);
        await tokenAuthProvider.login({ username: email, password });
        window.location.assign("/");
        return;
      }
      // The same person: the new sign-in, and the page carries on.
      if (json.tenants?.length) localStorage.setItem("tenants", JSON.stringify(json.tenants));
      if (json.user) localStorage.setItem("user", JSON.stringify(json.user));
      localStorage.setItem("access_token", json.access_token);
      sessionRenewed();
      setPassword("");
      setOpen(false);
      // Restarts the clock (above) for the new sign-in. Not an auth change:
      // nothing on the page needs to reload.
      window.dispatchEvent(new Event(SESSION_RENEWED));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await tokenAuthProvider.logout(undefined);
    sessionRenewed();
    window.location.assign("/login");
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown aria-labelledby="session-expired-title">
      <form onSubmit={signIn}>
        <DialogTitle id="session-expired-title">Your session has timed out</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {lasts ? `For security, a sign-in lasts ${lasts}. ` : "For security, a sign-in doesn't last forever. "}
              Sign in again to carry on: this page stays as it is, so anything you haven&apos;t saved
              is still here — save it again afterward.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              name="username"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{ input: { readOnly: !!knownEmail } }}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={signOut} disabled={busy}>
            Sign out
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SessionExpiredDialog;
