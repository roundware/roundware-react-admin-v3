// Public: the link in the "confirm your new email address" message (server
// docs/037: POST /auth/confirm-email-change/). Like the verify page, it
// changes the address only when the person clicks, not when the page opens:
// email security systems open the links in new mail to check them.
import { Alert, Button, CircularProgress, Typography } from "@mui/material";
import React, { useState } from "react";
import PublicCard, { postPublic, tokenFromLink } from "./PublicCard";

type State = { kind: "ready" | "working" | "done" | "error"; message?: string };

interface Changed {
  message: string;
  user_id: number;
  email: string;
}

/** If this browser is signed in to that account, show the new address there too. */
const updateSignedIn = ({ user_id, email }: Changed) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.id === user_id) localStorage.setItem("user", JSON.stringify({ ...user, email }));
  } catch {
    // Nothing stored, or storage blocked: nothing to update.
  }
};

const ConfirmEmailChangePage: React.FC = () => {
  const token = tokenFromLink();
  const [state, setState] = useState<State>(
    token
      ? { kind: "ready" }
      : { kind: "error", message: "This link is missing its code. Open it from the email again." }
  );

  const confirm = () => {
    setState({ kind: "working" });
    postPublic<Changed>("/auth/confirm-email-change/", { token })
      .then((changed) => {
        updateSignedIn(changed);
        setState({ kind: "done", message: changed.message });
      })
      .catch((e: Error) => setState({ kind: "error", message: e.message }));
  };

  return (
    <PublicCard title="Your new email address">
      {state.kind === "ready" && (
        <>
          <Typography>Click below to make this your account's email address.</Typography>
          <Button onClick={confirm} variant="contained" fullWidth sx={{ mt: 3 }}>
            Confirm my new address
          </Button>
        </>
      )}
      {state.kind === "working" && <CircularProgress size={24} />}
      {state.kind === "done" && (
        <Alert severity="success">{state.message} Sign in with it from now on.</Alert>
      )}
      {state.kind === "error" && <Alert severity="error">{state.message}</Alert>}
      {(state.kind === "done" || state.kind === "error") && (
        <Button href="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
          Go to sign in
        </Button>
      )}
    </PublicCard>
  );
};

export default ConfirmEmailChangePage;
