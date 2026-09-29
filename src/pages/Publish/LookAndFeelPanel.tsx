// ---------------------------------------------------------------------------
// Look & feel: the web app's three colours and its font
// (roundware-server-v3 docs/015-theming.md).
//
// Roles, labels, descriptions, defaults and the font list all come from
// GET /branding/schema/, the same definitions /config/ uses to fill in the
// live app — so what this panel shows for an unset colour is what
// participants see.
//
// Only colours the author actually picks are saved. Anything left alone stays
// "use the default", so a later change to the defaults reaches it. (The old
// panel saved whatever its pickers showed as soon as it loaded, which is how
// MUI's stock purple ended up stored in projects no one had styled.)
// ---------------------------------------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ColourRole,
  errMessage,
  getBranding,
  getThemeSchema,
  patchBranding,
  ThemeSchema,
} from "./api";

type RoleKey = ColourRole["key"];
type Palette = Partial<Record<RoleKey, string>>;

interface Props {
  projectId: number;
  onSaved?: () => void;
}

// --- Contrast (WCAG 2) -----------------------------------------------------

const luminance = (hex: string): number => {
  const full = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, "#$1$1$2$2$3$3");
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  if (!m) return 0;
  const c = (v: string) => {
    const x = parseInt(v, 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * c(m[1]) + 0.7152 * c(m[2]) + 0.0722 * c(m[3]);
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The better of black or white text on this colour — what the app uses. */
const textContrast = (hex: string) => Math.max(contrast(hex, "#000000"), contrast(hex, "#ffffff"));

/** Plain-language warnings for a palette that may be hard to use. */
function warnings(p: Record<RoleKey, string>, roles: ColourRole[]): string[] {
  const label = (k: RoleKey) => roles.find((r) => r.key === k)?.label ?? k;
  const out: string[] = [];
  roles.forEach((r) => {
    if (textContrast(p[r.key]) < 4.5)
      out.push(`${r.label}: neither black nor white text reads well on it.`);
  });
  if (contrast(p.primary, p.background) < 3)
    out.push(`Buttons may not stand out on cards: ${label("primary")} and ${label("background")} are too alike.`);
  if (contrast(p.primary, p.secondary) < 3)
    out.push(`Buttons may not stand out on the backdrop: ${label("primary")} and ${label("secondary")} are too alike.`);
  return out;
}

// --- Panel -----------------------------------------------------------------

const LookAndFeelPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [schema, setSchema] = useState<ThemeSchema | null>(null);
  const [chosen, setChosen] = useState<Palette>({});
  const [font, setFont] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getThemeSchema(), getBranding(projectId)])
      .then(([s, b]) => {
        if (cancelled) return;
        setSchema(s);
        setChosen({ ...(b.theme_json?.palette ?? {}) });
        setFont(b.google_font_family ?? "");
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  /** Saved only from user edits, never on load. */
  const save = (palette: Palette, fontFamily: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, {
          theme_json: Object.keys(palette).length ? { palette } : {},
          google_font_family: fontFamily,
        });
        onSaved?.();
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSaving(false);
      }
    }, 600);
  };

  if (!schema) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const effective = Object.fromEntries(
    schema.colours.map((r) => [r.key, chosen[r.key] || r.default])
  ) as Record<RoleKey, string>;
  const pick = (key: RoleKey, value: string) => {
    const next = { ...chosen, [key]: value };
    setChosen(next);
    save(next, font);
  };
  const pickFont = (value: string) => {
    setFont(value);
    save(chosen, value);
  };
  const reset = () => {
    setChosen({});
    setFont("");
    save({}, "");
  };
  const isDefault = !Object.keys(chosen).length && !font;
  const problems = warnings(effective, schema.colours);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Look &amp; feel</Typography>
        {saving && <CircularProgress size={16} />}
      </Stack>

      {schema.colours.map((role) => (
        <Stack key={role.key} direction="row" spacing={1.5} alignItems="center">
          <input
            type="color"
            aria-label={role.label}
            value={effective[role.key]}
            onChange={(e) => pick(role.key, e.target.value)}
            style={{ width: 44, height: 36, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}
          />
          <Box>
            <Typography variant="body2">
              {role.label}
              {!chosen[role.key] && (
                <Typography component="span" variant="caption" color="text.secondary">
                  {" "}
                  (default)
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {role.description}
            </Typography>
          </Box>
        </Stack>
      ))}

      <TextField
        select
        size="small"
        label="Font"
        value={font || schema.default_font}
        onChange={(e) => pickFont(e.target.value === schema.default_font ? "" : e.target.value)}
      >
        {/* A font saved before this list existed is still offered. */}
        {[...schema.fonts, ...(font && !schema.fonts.includes(font) ? [font] : [])].map((f) => (
          <MenuItem key={f} value={f}>
            {f}
            {f === schema.default_font ? " (default)" : ""}
          </MenuItem>
        ))}
      </TextField>

      {problems.length > 0 && (
        <Alert severity="warning" sx={{ "& ul": { m: 0, pl: 2 } }}>
          <ul>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Box>
        <Button size="small" onClick={reset} disabled={isDefault}>
          Reset to Roundware defaults
        </Button>
      </Box>
    </Stack>
  );
};

export default LookAndFeelPanel;
