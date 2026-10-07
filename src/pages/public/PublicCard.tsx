// ---------------------------------------------------------------------------
// The frame for the admin's public pages — the ones emails link to, reached
// without signing in: verify email, accept an invitation, reset a password
// (server services/email.py), and forgot password. Same look as Sign In.
// ---------------------------------------------------------------------------
import { Box, Card, CardContent, Typography } from "@mui/material";
import React from "react";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

/** POST JSON to the API without signing in; the server's message on failure. */
export async function postPublic<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SERVER_URL}/api/3${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      // Pydantic: "Value error, Password must be at least 8 characters." → the sentence
      const messages = detail.map((d: { msg?: string }) => {
        const msg = (d.msg || "").replace(/^Value error, /, "");
        return /not a valid email/i.test(msg) ? "That doesn't look like an email address." : msg;
      });
      throw new Error(messages.join(" "));
    }
    throw new Error(detail || `Something went wrong (${res.status}).`);
  }
  return data as T;
}

/** The token from the emailed link (?token=…). */
export const tokenFromLink = (): string | null => new URLSearchParams(window.location.search).get("token");

const PublicCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      p: 2,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}
  >
    <Card sx={{ width: 420, maxWidth: "100%", boxShadow: 6 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <img src="/logo.png" alt="Roundware" style={{ width: 80, marginBottom: 8 }} />
          <Typography variant="h5" component="h1" fontWeight="bold">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  </Box>
);

export default PublicCard;
