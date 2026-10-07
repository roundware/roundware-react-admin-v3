// Public: the link in the "verify your email" message (server
// services/email.send_verification_email → POST /auth/verify-email/).
import { Alert, Button, CircularProgress } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import PublicCard, { postPublic, tokenFromLink } from "./PublicCard";

const VerifyEmailPage: React.FC = () => {
  const [state, setState] = useState<{ kind: "working" | "done" | "error"; message?: string }>({
    kind: "working",
  });

  // Once: a second call (React runs effects twice in development) finds the
  // token used and would replace the success with "already used".
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const token = tokenFromLink();
    if (!token) {
      setState({ kind: "error", message: "This link is missing its code. Open it from the email again." });
      return;
    }
    postPublic("/auth/verify-email/", { token })
      .then(() => setState({ kind: "done" }))
      .catch((e: Error) => setState({ kind: "error", message: e.message }));
  }, []);

  return (
    <PublicCard title="Verify your email">
      {state.kind === "working" && <CircularProgress size={24} />}
      {state.kind === "done" && <Alert severity="success">Thanks — your email address is verified.</Alert>}
      {state.kind === "error" && <Alert severity="error">{state.message}</Alert>}
      {state.kind !== "working" && (
        <Button href="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
          Go to sign in
        </Button>
      )}
    </PublicCard>
  );
};

export default VerifyEmailPage;
