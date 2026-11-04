// Public: the link in the "verify your email" message (server
// services/email.send_verification_email → POST /auth/verify-email/).
//
// It confirms only when the person clicks the button, not when the page
// opens: email security systems open the links in new mail to check them,
// and would otherwise confirm addresses no one confirmed (server docs/036).
import { Alert, Button, CircularProgress, Typography } from "@mui/material";
import React, { useState } from "react";
import PublicCard, { postPublic, tokenFromLink } from "./PublicCard";

type State = { kind: "ready" | "working" | "done" | "error"; message?: string };

const VerifyEmailPage: React.FC = () => {
  const token = tokenFromLink();
  const [state, setState] = useState<State>(
    token
      ? { kind: "ready" }
      : { kind: "error", message: "This link is missing its code. Open it from the email again." }
  );

  const confirm = () => {
    setState({ kind: "working" });
    postPublic("/auth/verify-email/", { token })
      .then(() => setState({ kind: "done" }))
      .catch((e: Error) => setState({ kind: "error", message: e.message }));
  };

  return (
    <PublicCard title="Verify your email">
      {state.kind === "ready" && (
        <>
          <Typography>Click below to confirm this is your email address.</Typography>
          <Button onClick={confirm} variant="contained" fullWidth sx={{ mt: 3 }}>
            Confirm my email address
          </Button>
        </>
      )}
      {state.kind === "working" && <CircularProgress size={24} />}
      {state.kind === "done" && <Alert severity="success">Thanks — your email address is verified.</Alert>}
      {state.kind === "error" && <Alert severity="error">{state.message}</Alert>}
      {(state.kind === "done" || state.kind === "error") && (
        <Button href="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
          Go to sign in
        </Button>
      )}
    </PublicCard>
  );
};

export default VerifyEmailPage;
