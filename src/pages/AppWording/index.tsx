// ---------------------------------------------------------------------------
// App wording — the web app's built-in wording, and the project's own
// versions of it, per language (roundware-server-v3 docs/017, phase 3).
//
// The app ships its wording in a few languages (the catalogues vendored in
// src/config/webAppWording, synced by the web app's
// scripts/sync-wording-to-admin.mjs). Here a project can replace any string
// in any of its languages — or write all of them, for a language the app
// doesn't ship. Stored on the branding as wording_json; the app lays it over
// its catalogue in the visitor's language.
// ---------------------------------------------------------------------------
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Title } from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage, getBranding, patchBranding } from "../Publish/api";

type Catalogue = Record<string, string>; // "ns:key.path" → text

const flatten = (obj: Record<string, unknown>, prefix: string, out: Catalogue) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v as Record<string, unknown>, key, out);
    else if (typeof v === "string") out[key] = v;
  }
};

// {lang: {"ns:key": text}}
const CATALOGUES: Record<string, Catalogue> = (() => {
  const files = import.meta.glob("../../config/webAppWording/*/*.json", {
    eager: true,
    import: "default",
  }) as Record<string, Record<string, unknown>>;
  const out: Record<string, Catalogue> = {};
  for (const [path, json] of Object.entries(files)) {
    const m = /webAppWording\/([^/]+)\/([^/]+)\.json$/.exec(path);
    if (!m) continue;
    const [, lang, ns] = m;
    const flat: Catalogue = {};
    flatten(json, "", flat);
    for (const [k, v] of Object.entries(flat)) (out[lang] ??= {})[`${ns}:${k}`] = v;
  }
  return out;
})();

const AREAS: Array<{ ns: string; label: string }> = [
  { ns: "intro", label: "Intro screen" },
  { ns: "listen", label: "Listening" },
  { ns: "speak", label: "Recording" },
  { ns: "looping", label: "Looping recording" },
  { ns: "dialogs", label: "Dialogs and browser help" },
  { ns: "help", label: "Help screens" },
  { ns: "info", label: "Info panel" },
  { ns: "common", label: "Shared words (buttons and the like)" },
  { ns: "boot", label: "Loading and unavailable" },
];

interface Lang {
  code: string;
  name: string;
}

const AppWordingPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const [languages, setLanguages] = useState<Lang[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [wording, setWording] = useState<Record<string, Record<string, string>>>({});
  const [search, setSearch] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Record<string, Record<string, string | null>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageIds = selectedProject?.language_ids ?? [];
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    Promise.all([getBranding(projectId), apiFetcher(`/languages/`)])
      .then(([branding, { json }]) => {
        if (cancelled) return;
        const all = (Array.isArray(json) ? json : json?.results ?? []) as {
          id: number;
          language_code: string;
          name: string;
        }[];
        const langs = languageIds
          .map((id) => all.find((l) => l.id === Number(id)))
          .filter(Boolean)
          .map((l) => ({ code: l!.language_code, name: l!.name }));
        setLanguages(langs.length ? langs : [{ code: "en", name: "English" }]);
        setLanguage((cur) => cur ?? langs[0]?.code ?? "en");
        setWording((branding.wording as Record<string, Record<string, string>>) ?? {});
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId, JSON.stringify(languageIds)]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const lang = language ?? "en";
  const shipped = !!CATALOGUES[lang];
  // The app's own wording in this language, else English (what the app shows).
  const builtIn = useMemo(() => ({ ...CATALOGUES.en, ...(CATALOGUES[lang] ?? {}) }), [lang]);
  const mine = wording[lang] ?? {};

  const set = (key: string, text: string) => {
    setWording((w) => {
      const next = { ...(w[lang] ?? {}) };
      if (text) next[key] = text;
      else delete next[key];
      return { ...w, [lang]: next };
    });
    pending.current = { ...pending.current, [lang]: { ...(pending.current[lang] ?? {}), [key]: text || null } };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!projectId) return;
      const changes = pending.current;
      pending.current = {};
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, { wording: changes });
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSaving(false);
      }
    }, 700);
  };

  const q = search.trim().toLowerCase();
  const matches = (key: string) => {
    if (onlyChanged && !mine[key]) return false;
    if (!q) return true;
    return [key, builtIn[key], CATALOGUES.en[key], mine[key]].some((s) => s?.toLowerCase().includes(q));
  };

  if (!selectedProject) {
    return (
      <Container sx={{ py: 4 }}>
        <Title title="App wording" />
        <Typography color="text.secondary">Select a project first.</Typography>
      </Container>
    );
  }

  const shippedNames = Object.keys(CATALOGUES)
    .sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : 0))
    .map((c) => {
      try {
        return new Intl.DisplayNames(["en"], { type: "language" }).of(c) ?? c;
      } catch {
        return c;
      }
    })
    .join(", ");
  const langName = languages.find((l) => l.code === lang)?.name ?? lang;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Title title="App wording" />
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">App wording</Typography>
        {saving && <CircularProgress size={18} />}
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        The words the app itself uses — buttons, prompts, recording steps, dialogs, help.
        Roundware provides them in {shippedNames}. Write your own version of any of them here, in
        each of your project&apos;s languages; leave a box empty to keep Roundware&apos;s.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
        {languages.length > 1 && (
          <ToggleButtonGroup size="small" exclusive value={lang} onChange={(_e, v) => v && setLanguage(v)}>
            {languages.map((l) => (
              <ToggleButton key={l.code} value={l.code} sx={{ px: 1.5 }}>
                {l.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <FormControlLabel
          control={<Switch checked={onlyChanged} onChange={(_e, c) => setOnlyChanged(c)} />}
          label="Only what you've changed"
        />
      </Stack>

      {!shipped && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Roundware doesn&apos;t come in {langName} yet, so participants see the English wording
          (shown in grey) for anything you don&apos;t write here.
        </Alert>
      )}

      {AREAS.map((area) => {
        const keys = Object.keys(CATALOGUES.en)
          .filter((k) => k.startsWith(`${area.ns}:`))
          .filter(matches);
        if (!keys.length) return null;
        const changed = keys.filter((k) => mine[k]).length;
        return (
          <Accordion
            // Re-keyed so searching or filtering opens the matching areas.
            key={`${area.ns}-${!!q || onlyChanged}`}
            disableGutters
            defaultExpanded={!!q || onlyChanged}
            TransitionProps={{ unmountOnExit: true }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="subtitle1">{area.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {keys.length} {keys.length === 1 ? "string" : "strings"}
                  {changed ? ` · ${changed} your own` : ""}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {keys.map((key) => {
                  const original = builtIn[key] ?? "";
                  const long = original.length > 70 || original.includes("<");
                  return (
                    <Box key={key}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline={long}
                        minRows={long ? 2 : undefined}
                        label={CATALOGUES.en[key]?.slice(0, 80)}
                        value={mine[key] ?? ""}
                        placeholder={original}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => set(key, e.target.value)}
                        helperText={key.replace(":", " · ")}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Container>
  );
};

export default AppWordingPage;
