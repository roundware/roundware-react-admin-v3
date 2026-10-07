// Public: ask for a password reset email (POST /auth/request-password-reset/).
// The server answers the same whether or not the address has an account, so
// this page can't be used to find out who does.
import { Alert, Button, CircularProgress, Link, TextField } from "@mui/material";
import React, { useState } from "react";
import PublicCard, { postPublic } from "./PublicCard";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await postPublic("/auth/request-password-reset/", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicCard title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <Alert severity="success">
          If {email.trim()} has an account, a reset link is on its way. It works for an hour.
        </Alert>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            size="small"
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 2 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Send reset link"}
          </Button>
        </form>
      )}
      <Link href="/login" variant="body2" sx={{ display: "block", textAlign: "center", mt: 2 }}>
        Back to sign in
      </Link>
    </PublicCard>
  );
};

export default ForgotPasswordPage;
