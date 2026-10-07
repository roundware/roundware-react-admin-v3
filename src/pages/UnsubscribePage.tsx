// ---------------------------------------------------------------------------
// Unsubscribe — public: an outside address stops a project's notification
// emails, from the link in one (server docs/019). No sign-in: the link's
// signed token names the recipient.
// ---------------------------------------------------------------------------
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

type State =
  | { kind: "working" }
  | { kind: "done"; email: string | null; project: string | null }
  | { kind: "error"; message: string };

const UnsubscribePage: React.FC = () => {
  const [state, setState] = useState<State>({ kind: "working" });

  // Once: React runs effects twice in development.
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState({ kind: "error", message: "This link is missing its code." });
      return;
    }
    fetch(`${import.meta.env.VITE_SERVER_URL}/api/3/notification-rules/unsubscribe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.detail || "Something went wrong.");
        setState({ kind: "done", email: body.email ?? null, project: body.project ?? null });
      })
      .catch((e: Error) => setState({ kind: "error", message: e.message }));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ maxWidth: 480, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Roundware notifications
          </Typography>
          {state.kind === "working" && <CircularProgress size={24} />}
          {state.kind === "done" && (
            <Typography>
              {state.email
                ? `${state.email} won't get these emails${state.project ? ` about ${state.project}` : ""} any more.`
                : "You won't get these emails any more."}
            </Typography>
          )}
          {state.kind === "error" && <Typography color="error">{state.message}</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UnsubscribePage;
