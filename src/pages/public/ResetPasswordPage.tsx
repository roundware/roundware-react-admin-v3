// Public: the link in the password reset email
// (services/email.send_password_reset_email → POST /auth/confirm-password-reset/).
import { Alert, Button, CircularProgress, Link, TextField } from "@mui/material";
import React, { useState } from "react";
import PublicCard, { postPublic, tokenFromLink } from "./PublicCard";

const ResetPasswordPage: React.FC = () => {
  const token = tokenFromLink();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : "This link is missing its code. Open it from the email again."
  );

  const mismatch = again.length > 0 && again !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || mismatch) return;
    setLoading(true);
    setError(null);
    try {
      await postPublic("/auth/confirm-password-reset/", { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicCard title="Choose a new password">
      {done ? (
        <>
          <Alert severity="success">Your password is changed.</Alert>
          <Button href="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
            Sign in
          </Button>
        </>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}{" "}
              {token && (
                <Link href="/forgot-password" variant="body2">
                  Ask for a new link
                </Link>
              )}
            </Alert>
          )}
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="At least 8 characters."
            fullWidth
            required
            autoFocus
            size="small"
            margin="normal"
            disabled={!token}
          />
          <TextField
            label="New password, again"
            type="password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            error={mismatch}
            helperText={mismatch ? "The two don't match." : " "}
            fullWidth
            required
            size="small"
            margin="normal"
            disabled={!token}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !token || mismatch || password.length < 8}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Change password"}
          </Button>
        </form>
      )}
    </PublicCard>
  );
};

export default ResetPasswordPage;
