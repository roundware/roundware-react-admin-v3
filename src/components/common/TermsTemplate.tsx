// ---------------------------------------------------------------------------
// "Start from Roundware's template" beside a project's terms (2026-10-28):
// the participant terms template (roundware.app/legal/participant-terms),
// with the project's and organization's names filled in, to copy, or to
// insert where the field is empty. The template's one source is
// roundware-saas-home/legal/participant-terms.md, which the site publishes
// as Markdown; this turns it into the plain text participants see.
// ---------------------------------------------------------------------------
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { SITE_URL } from "./AgreeToTerms";

const SOURCE = `${SITE_URL}/legal/participant-terms.md`;
const PAGE = `${SITE_URL}/legal/participant-terms/`;

const organizationName = (): string => {
  try {
    const slug = localStorage.getItem("tenant_slug");
    const tenants = JSON.parse(localStorage.getItem("tenants") || "[]") as { slug: string; name: string }[];
    return tenants.find((t) => t.slug === slug)?.name ?? "";
  } catch {
    return "";
  }
};

/** The participant-facing part of the template, as plain text. */
export function templateText(md: string, project: string, organization: string): string {
  const start = md.search(/^# Terms for contributing/m);
  let text = start >= 0 ? md.slice(start) : md;
  text = text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/g, "$1") // links, keeping their words
    .replace(/^---+\s*$/gm, "") // rules
    .replace(/^- /gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (project) text = text.replaceAll("[PROJECT NAME]", project);
  if (organization) text = text.replaceAll("[ORGANIZATION]", organization);
  return text + "\n";
}

const TermsTemplate: React.FC<{
  projectName?: string;
  /** Given where the field can be filled directly (and it's empty). */
  onUse?: (text: string) => void;
}> = ({ projectName = "", onUse }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const show = async () => {
    setOpen(true);
    setCopied(false);
    if (text) return;
    try {
      const r = await fetch(SOURCE);
      if (!r.ok) throw new Error(String(r.status));
      setText(templateText(await r.text(), projectName.trim(), organizationName()));
    } catch {
      setError("Couldn't load the template. You can read it at roundware.app instead.");
    }
  };

  return (
    <>
      <Link component="button" type="button" variant="body2" onClick={show}>
        Start from Roundware's template
      </Link>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Participant terms template</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            A starting point: change it to fit your project. Text in [brackets] is for you to fill in or choose.
            Participants keep ownership and give you permission to use their contributions; if you need to own them
            outright, replace section 2. If you broadcast contributions, ask a lawyer whether it covers what you do.{" "}
            <Link href={PAGE} target="_blank" rel="noopener">
              More about it
            </Link>
          </Alert>
          {error && <Alert severity="error">{error}</Alert>}
          {!text && !error && <CircularProgress size={24} />}
          {text && (
            <Typography
              component="pre"
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", bgcolor: "action.hover", p: 2, borderRadius: 1, maxHeight: "50vh", overflow: "auto" }}
            >
              {text}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button
            disabled={!text}
            onClick={async () => {
              if (!text) return;
              await navigator.clipboard.writeText(text);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          {onUse && (
            <Button
              variant="contained"
              disabled={!text}
              onClick={() => {
                if (text) onUse(text);
                setOpen(false);
              }}
            >
              Use it
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TermsTemplate;
