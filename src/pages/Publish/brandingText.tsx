// ---------------------------------------------------------------------------
// The text on Look & Feel, in each of the project's languages
// (roundware-server-v3 docs/017).
//
// One switch at the top of the page picks the language being edited, and
// every text box on the page shows and saves that language — rather than a
// row of tabs on each of a dozen fields. The server keeps the default
// language's text in the branding fields and the others as translations; a
// text left empty in a language falls back to the default language's for
// participants, which is what the grey placeholder shows.
// ---------------------------------------------------------------------------
import { Stack, TextField, TextFieldProps, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage, getBranding, patchBranding } from "./api";

export interface ProjectLanguage {
  id: number;
  code: string;
  name: string;
}

type Texts = Record<string, Record<string, unknown>>; // {code: {field: value}}

interface BrandingText {
  languages: ProjectLanguage[];
  /** The project's default language — the first tab, and the fallback. */
  defaultCode: string | null;
  /** The language being edited. */
  language: string | null;
  setLanguage: (code: string) => void;
  get: (field: string, code?: string | null) => string;
  /** Any value, e.g. the info tabs' list. */
  getValue: (field: string, code?: string | null) => unknown;
  set: (field: string, value: unknown) => void;
  saving: boolean;
  error: string | null;
}

const Ctx = createContext<BrandingText | null>(null);

/** The language switch's state, if this is inside Look & Feel's text area. */
export const useBrandingText = () => useContext(Ctx);

export const BrandingTextProvider: React.FC<{
  projectId: number;
  onSaved?: () => void;
  children: React.ReactNode;
}> = ({ projectId, onSaved, children }) => {
  const { selectedProject } = useProjects();
  const [languages, setLanguages] = useState<ProjectLanguage[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [texts, setTexts] = useState<Texts>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Texts>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageIds = selectedProject?.language_ids ?? [];
  useEffect(() => {
    let cancelled = false;
    Promise.all([getBranding(projectId), apiFetcher(`/languages/`)])
      .then(([branding, { json }]) => {
        if (cancelled) return;
        const all = (Array.isArray(json) ? json : json?.results ?? []) as {
          id: number;
          language_code: string;
          name: string;
        }[];
        // The project's languages, in its order: default first.
        const langs = languageIds
          .map((id) => all.find((l) => l.id === Number(id)))
          .filter(Boolean)
          .map((l) => ({ id: l!.id, code: l!.language_code, name: l!.name }));
        const def = (branding.default_language as string | null) ?? langs[0]?.code ?? null;
        setLanguages(langs);
        setDefaultCode(def);
        setLanguage((cur) => cur ?? def);
        setTexts((branding.localizations as Texts) ?? {});
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId, JSON.stringify(languageIds)]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const get = useCallback(
    (field: string, code?: string | null) => {
      const c = code ?? language;
      const v = c ? texts[c]?.[field] : undefined;
      return typeof v === "string" ? v : "";
    },
    [texts, language]
  );

  const getValue = useCallback(
    (field: string, code?: string | null) => {
      const c = code ?? language;
      return c ? texts[c]?.[field] : undefined;
    },
    [texts, language]
  );

  const set = useCallback(
    (field: string, value: unknown) => {
      if (!language) return;
      setTexts((t) => ({ ...t, [language]: { ...(t[language] ?? {}), [field]: value } }));
      // Empty in another language clears its translation (null), so the
      // default language's shows; empty in the default language is kept.
      const empty = value === "" || (Array.isArray(value) && value.length === 0);
      const sent = empty && language !== defaultCode ? null : value;
      pending.current = {
        ...pending.current,
        [language]: { ...(pending.current[language] ?? {}), [field]: sent },
      };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const localizations = pending.current;
        pending.current = {};
        setSaving(true);
        setError(null);
        try {
          await patchBranding(projectId, { localizations });
          onSaved?.();
        } catch (e) {
          setError(errMessage(e));
        } finally {
          setSaving(false);
        }
      }, 700);
    },
    [language, defaultCode, projectId, onSaved]
  );

  return (
    <Ctx.Provider value={{ languages, defaultCode, language, setLanguage, get, getValue, set, saving, error }}>
      {children}
    </Ctx.Provider>
  );
};

/** "Editing: English (default) | Spanish" — only when there's a choice. */
export const LanguageSwitch: React.FC = () => {
  const ctx = useBrandingText();
  if (!ctx || ctx.languages.length < 2) return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="body2" color="text.secondary">
        Editing text in
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={ctx.language}
        onChange={(_e, v) => v && ctx.setLanguage(v)}
      >
        {ctx.languages.map((l) => (
          <ToggleButton key={l.code} value={l.code} sx={{ px: 1.5 }}>
            {l.name}
            {l.code === ctx.defaultCode ? " (default)" : ""}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

/** A branding text, in the language being edited. */
export const BrandingTextField: React.FC<
  { field: string; label: string } & Omit<TextFieldProps, "value" | "onChange">
> = ({ field, label, helperText, ...props }) => {
  const ctx = useBrandingText();
  if (!ctx) return null;
  const isDefault = !ctx.language || ctx.language === ctx.defaultCode;
  const fallback = isDefault ? "" : ctx.get(field, ctx.defaultCode);
  const defaultName = ctx.languages.find((l) => l.code === ctx.defaultCode)?.name;
  return (
    <TextField
      {...props}
      label={label}
      value={ctx.get(field)}
      onChange={(e) => ctx.set(field, e.target.value)}
      placeholder={fallback || undefined}
      InputLabelProps={fallback ? { shrink: true } : undefined}
      helperText={
        !isDefault && !ctx.get(field) && fallback
          ? `Not translated: participants see the ${defaultName} text, shown in grey.`
          : helperText
      }
      fullWidth
      size="small"
    />
  );
};
