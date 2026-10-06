// ---------------------------------------------------------------------------
// Look & feel: the web app's three colors, its fonts, and a few style
// choices — corners, button shape, button text, text size
// (roundware-server-v3 docs/015-theming.md).
//
// Roles, labels, descriptions, defaults and the font list all come from
// GET /branding/schema/, the same definitions /config/ uses to fill in the
// live app — so what this panel shows for an unset color is what
// participants see.
//
// Only colors the author actually picks are saved. Anything left alone stays
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  ColorRole,
  errMessage,
  getBranding,
  getThemeSchema,
  patchBranding,
  ThemeSchema,
} from "./api";

type RoleKey = ColorRole["key"];
type Palette = Partial<Record<RoleKey, string>>;
/** Chosen style options by key, and headingFont; absent means the default. */
type Style = Record<string, string>;

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

/**
 * Plain-language warnings for a palette that may be hard to use: the Brand
 * color is drawn on the other two (buttons everywhere; the intro's title on
 * the backdrop), so it needs to stand apart from each. 3:1 is WCAG's minimum
 * for large text and controls.
 *
 * Text *on* each color needs no check: the app picks black or white for it,
 * and one of the two always reaches 4.5:1. (There was a check for that; it
 * could never fire.)
 */
function warnings(p: Record<RoleKey, string>, roles: ColorRole[]): string[] {
  const label = (k: RoleKey) => roles.find((r) => r.key === k)?.label ?? k;
  const out: string[] = [];
  const pair = (other: RoleKey, where: string) => {
    const ratio = contrast(p.primary, p[other]);
    if (ratio < 3)
      out.push(
        `${label("primary")} is hard to see on the ${label(other)} (contrast ${ratio.toFixed(1)}:1; aim for at least 3:1). ` +
          `This affects ${where}. Make one of the two lighter or darker.`
      );
  };
  pair("secondary", "the intro's title and buttons");
  pair("background", "buttons and links on cards and panels");
  return out;
}

// --- Panel -----------------------------------------------------------------

const LookAndFeelPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [schema, setSchema] = useState<ThemeSchema | null>(null);
  const [chosen, setChosen] = useState<Palette>({});
  const [font, setFont] = useState("");
  const [style, setStyle] = useState<Style>({});
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
        setStyle({ ...(b.theme_json?.style ?? {}) });
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
  const save = (palette: Palette, fontFamily: string, styleChoices: Style) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await patchBranding(projectId, {
          theme_json: {
            ...(Object.keys(palette).length ? { palette } : {}),
            ...(Object.keys(styleChoices).length ? { style: styleChoices } : {}),
          },
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
    schema.colors.map((r) => [r.key, chosen[r.key] || r.default])
  ) as Record<RoleKey, string>;
  const pick = (key: RoleKey, value: string) => {
    const next = { ...chosen, [key]: value };
    setChosen(next);
    save(next, font, style);
  };
  const pickFont = (value: string) => {
    setFont(value);
    save(chosen, value, style);
  };
  /** A default choice is stored as nothing, so later default changes reach it. */
  const pickStyle = (key: string, value: string, defaultValue: string) => {
    const next = { ...style };
    if (!value || value === defaultValue) delete next[key];
    else next[key] = value;
    setStyle(next);
    save(chosen, font, next);
  };
  const reset = () => {
    setChosen({});
    setFont("");
    setStyle({});
    save({}, "", {});
  };
  const isDefault = !Object.keys(chosen).length && !font && !Object.keys(style).length;
  const problems = warnings(effective, schema.colors);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Look &amp; feel</Typography>
        {saving && <CircularProgress size={16} />}
      </Stack>

      {schema.colors.map((role) => (
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

      <TextField
        select
        size="small"
        label="Heading font"
        helperText="Titles, questions and headings."
        value={style.headingFont || ""}
        onChange={(e) => pickStyle("headingFont", e.target.value, "")}
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
      >
        <MenuItem value="">Same as text (default)</MenuItem>
        {[...schema.fonts, ...(style.headingFont && !schema.fonts.includes(style.headingFont) ? [style.headingFont] : [])].map(
          (f) => (
            <MenuItem key={f} value={f}>
              {f}
            </MenuItem>
          )
        )}
      </TextField>

      {(schema.styles ?? []).map((choice) => {
        const value = style[choice.key] || choice.default;
        return (
          <Box key={choice.key}>
            <Typography variant="body2">
              {choice.label}
              {!style[choice.key] && (
                <Typography component="span" variant="caption" color="text.secondary">
                  {" "}
                  (default)
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              {choice.description}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={value}
              onChange={(_e, v) => v && pickStyle(choice.key, v, choice.default)}
              aria-label={choice.label}
              sx={{ flexWrap: "wrap" }}
            >
              {choice.options.map((o) => (
                <ToggleButton key={o.value} value={o.value} sx={{ px: 1.25, textTransform: "none" }}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        );
      })}

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
