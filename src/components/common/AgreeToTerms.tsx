// ---------------------------------------------------------------------------
// "I agree to the Terms of Service and Privacy Policy" (2026-10-28): signing
// up, and accepting an invitation as someone new. The server requires it
// (accept_terms) and records when, and which version. The documents live
// on roundware.app (the roundware-saas-home repository, legal/).
// ---------------------------------------------------------------------------
import { Checkbox, FormControlLabel, Link, Typography } from "@mui/material";
import React from "react";

export const SITE_URL = String(import.meta.env.VITE_SITE_URL || "https://roundware.app").replace(/\/$/, "");
export const TERMS_URL = `${SITE_URL}/legal/terms/`;
export const PRIVACY_URL = `${SITE_URL}/legal/privacy/`;

const AgreeToTerms: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <FormControlLabel
    sx={{ mt: 1, alignItems: "flex-start" }}
    control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} sx={{ pt: 0.25 }} />}
    label={
      <Typography variant="body2">
        I agree to the{" "}
        <Link href={TERMS_URL} target="_blank" rel="noopener">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={PRIVACY_URL} target="_blank" rel="noopener">
          Privacy Policy
        </Link>
        .
      </Typography>
    }
  />
);

export default AgreeToTerms;
