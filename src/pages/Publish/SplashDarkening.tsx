import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { errMessage, getBranding, getThemeSchema, patchBranding, ThemeSchema } from "./api";

/**
 * How dark the splash image is made behind the intro text — the theme's
 * `splashDarkening` choice (server core/theme.py), offered beside the splash
 * image it applies to rather than with the other style choices (Halsey,
 * 2026-10-16). Saved on its own: the theme is read fresh and only this
 * choice changed, so Look & Feel's own saves and this one don't undo each
 * other (LookAndFeelPanel leaves it out the same way).
 */
export const SPLASH_DARKENING = "splashDarkening";
/** The same for the Home screen's background (docs/025). */
export const HOME_DARKENING = "homeDarkening";
/** Whether Home's image buttons show their labels (docs/025). This
 *  component offers any one style choice, so App start uses it too. */
export const HOME_BUTTON_LABELS = "homeButtonLabels";
/** Which darkening goes with which background image. */
export const DARKENING_FOR_SLOT: Record<string, string> = {
  splash_background: SPLASH_DARKENING,
  home_background: HOME_DARKENING,
};

const SplashDarkening: React.FC<{ projectId: number; onSaved?: () => void; styleKey?: string }> = ({
  projectId,
  onSaved,
  styleKey = SPLASH_DARKENING,
}) => {
  const [choice, setChoice] = useState<ThemeSchema["styles"][number] | null>(null);
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getThemeSchema(), getBranding(projectId)])
      .then(([s, b]) => {
        if (cancelled) return;
        const c = (s.styles ?? []).find((x) => x.key === styleKey) ?? null;
        setChoice(c);
        setValue((b.theme_json?.style ?? {})[styleKey] ?? c?.default ?? null);
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId, styleKey]);

  if (!choice || value === null) return null;

  const pick = async (v: string) => {
    setValue(v);
    setError(null);
    try {
      const b = await getBranding(projectId);
      const style = { ...(b.theme_json?.style ?? {}) };
      // The default is stored as nothing, so a later default reaches it.
      if (v === choice.default) delete style[styleKey];
      else style[styleKey] = v;
      await patchBranding(projectId, {
        theme_json: { ...(b.theme_json ?? {}), style },
      });
      onSaved?.();
    } catch (e) {
      setError(errMessage(e));
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="body2">{choice.label}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {choice.description}
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={value}
        onChange={(_e, v) => v && pick(v)}
        aria-label={choice.label}
        sx={{ flexWrap: "wrap" }}
      >
        {choice.options.map((o) => (
          <ToggleButton key={o.value} value={o.value} sx={{ px: 1.25, textTransform: "none" }}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error && (
        <Typography color="error" variant="caption" display="block">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default SplashDarkening;
