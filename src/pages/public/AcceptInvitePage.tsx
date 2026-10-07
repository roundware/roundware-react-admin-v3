// Public: the link in a team invitation (services/email.send_invitation_email).
// Looks the invitation up first (GET /invitations/lookup/) to greet the
// person and know whether they already have an account; accepting
// (POST /invitations/accept/) signs them in, as Sign In would, in the
// organization that invited them.
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import PublicCard, { postPublic, SERVER_URL, tokenFromLink } from "./PublicCard";

interface Lookup {
  status: "ok" | "accepted" | "expired" | "invalid";
  email: string | null;
  organization: string | null;
  role: string | null;
  has_account: boolean;
}

interface Accepted {
  access_token: string;
  user: unknown;
  tenant: { slug: string };
  tenants: unknown[];
}

const ROLE_WORDS: Record<string, string> = {
  owner: "an owner",
  admin: "an admin",
  editor: "an editor",
  viewer: "a viewer",
};

/** As AuthProvider.login stores a sign-in: tenants and slug before the token. */
function signIn(data: Accepted) {
  localStorage.setItem("tenants", JSON.stringify(data.tenants));
  localStorage.setItem("tenant_slug", data.tenant.slug);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("access_token", data.access_token);
  window.dispatchEvent(new Event("roundware-auth-change"));
  window.location.assign("/");
}

const AcceptInvitePage: React.FC = () => {
  const token = tokenFromLink();
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLookup({ status: "invalid", email: null, organization: null, role: null, has_account: false });
      return;
    }
    fetch(`${SERVER_URL}/api/3/invitations/lookup/?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setLookup)
      .catch(() => setError("Couldn't reach Roundware. Try again in a moment."));
  }, [token]);

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = lookup?.has_account
        ? { token }
        : { token, first_name: first.trim(), last_name: last.trim(), password };
      signIn(await postPublic<Accepted>("/invitations/accept/", body));
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!lookup) {
    return (
      <PublicCard title="Join a team">
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress size={24} />}
      </PublicCard>
    );
  }

  if (lookup.status !== "ok") {
    const message = {
      invalid: "This invitation link isn't valid. Open it from the email again, or ask for a new invitation.",
      expired: "This invitation has expired. Ask whoever invited you to send a new one.",
      accepted: "This invitation has already been used. Sign in to continue.",
    }[lookup.status];
    return (
      <PublicCard title="Join a team">
        <Alert severity={lookup.status === "accepted" ? "info" : "error"}>{message}</Alert>
        <Button href="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
          Go to sign in
        </Button>
      </PublicCard>
    );
  }

  const who = ROLE_WORDS[lookup.role ?? ""] ?? "a member";
  return (
    <PublicCard title={`Join ${lookup.organization ?? "the team"}`} subtitle={`as ${who}, on Roundware`}>
      <form onSubmit={accept}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {lookup.has_account ? (
          <Typography variant="body2" sx={{ mb: 1 }}>
            You already have a Roundware account as <strong>{lookup.email}</strong>. Accept to add{" "}
            {lookup.organization} to it.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="body2">
              Create your account for <strong>{lookup.email}</strong>.
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField label="First name" value={first} onChange={(e) => setFirst(e.target.value)} required size="small" fullWidth autoFocus />
              <TextField label="Last name" value={last} onChange={(e) => setLast(e.target.value)} size="small" fullWidth />
            </Stack>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="At least 8 characters."
              required
              size="small"
              fullWidth
            />
          </Stack>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading || (!lookup.has_account && (!first.trim() || password.length < 8))}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Join ${lookup.organization ?? "the team"}`}
        </Button>
      </form>
    </PublicCard>
  );
};

export default AcceptInvitePage;
