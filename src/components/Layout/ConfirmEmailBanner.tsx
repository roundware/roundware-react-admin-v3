// Until someone confirms their email address, they can build and try a
// project but not put it online: publish it, connect a domain or import
// (server core/verification.py). This says so, and sends the link again.
import { Alert, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { errMessage } from "../../pages/Publish/api";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";

interface Me {
  email: string;
  is_superuser: boolean;
  email_verified: boolean;
}

const ConfirmEmailBanner: React.FC = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetcher("/users/me/")
      .then(({ json }) => setMe(json))
      .catch(() => setMe(null));
  }, []);

  if (!me || me.email_verified || me.is_superuser) return null;

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      const { json } = await apiFetcher("/auth/resend-verification/", { method: "POST" });
      setSent(json?.message === "Email is already verified." ? "confirmed" : "sent");
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (sent === "confirmed") {
    return (
      <Alert severity="success" sx={{ m: 2 }}>
        Your email address is confirmed. Reload the page to publish.
      </Alert>
    );
  }

  return (
    <Alert
      severity="warning"
      sx={{ m: 2 }}
      action={
        sent ? undefined : (
          <Button color="inherit" size="small" onClick={resend} disabled={busy}>
            Send it again
          </Button>
        )
      }
    >
      {sent
        ? `We sent a new link to ${me.email}.`
        : `Confirm your email address to publish your project: use the link we sent to ${me.email}.`}
      {error ? ` ${error}` : ""}
    </Alert>
  );
};

export default ConfirmEmailBanner;
