/**
 * Speaker states on the listen map, and how a speaker looks in each — a twin
 * of the web app's utils/speakerStyles.ts, so Map appearance's map draws
 * speakers as participants see them.
 *
 * Three layers, each blank value inheriting from the one before:
 *   1. the app's built-in styles (map.speakerStateStyles in webAppDefaults)
 *   2. the project's overrides (the same keys in its ui_config_json)
 *   3. the speaker's own colors (fill_color, border_color), which are its
 *      base colors: a state's explicit color still wins (e.g. a playing
 *      border). Only colors are per speaker for now; the resolver takes the
 *      speaker last so per-speaker state styles can join it later.
 */
import type { ProjectPalette } from "../../hooks/useProjectPalette";

export type StateName = "not_loaded" | "idle" | "playing" | "current_session" | "recent";

export interface StateStyle {
  fill_color: string | null;
  fill_opacity: number | null;
  stroke_color: string | null;
  stroke_opacity: number | null;
  stroke_weight: number | null;
  z_index_boost?: number;
}

/** The fields an author edits (z_index_boost stays in Advanced configuration). */
export type StyleField = "fill_color" | "fill_opacity" | "stroke_color" | "stroke_opacity" | "stroke_weight";

export const STATES: { name: StateName; label: string; help: string; looping?: boolean }[] = [
  { name: "not_loaded", label: "Not loaded", help: "Out of range: its audio isn't loaded." },
  { name: "idle", label: "Ready", help: "Loaded and in reach, not playing." },
  { name: "playing", label: "Playing", help: "Heard right now." },
  { name: "current_session", label: "Yours", help: "A loop the participant has just recorded.", looping: true },
  {
    name: "recent",
    label: "Recent",
    help: "Among the newest loops. How many is map.recentSpeakerCount in Advanced configuration (0, the default, turns it off).",
    looping: true,
  },
];

/** The states a project's speakers can be in: classic projects have three. */
export const statesFor = (recordingMethod: string | undefined) =>
  STATES.filter((s) => !s.looping || recordingMethod === "looping");

const ROLE: Record<string, keyof ProjectPalette> = {
  brand: "primary",
  backdrop: "secondary",
  card: "background",
};

/** A config color — hex, or a theme role like "brand/25" — as #rrggbb. */
export const resolveColor = (value: string | null | undefined, palette: ProjectPalette): string | null => {
  if (!value) return null;
  const role = /^(brand|backdrop|card)(\/\d+)?$/.exec(value);
  const hex = role ? palette[ROLE[role[1]]] : value;
  return /^#[0-9a-f]{6}/i.test(hex) ? hex.slice(0, 7) : null;
};

export interface SpeakerColors {
  fill_color?: string | null;
  border_color?: string | null;
}

/** How one speaker looks in a state, as Google Maps polygon options. */
export const resolveStyle = (
  speaker: SpeakerColors,
  state: StateName,
  mapConfig: Record<string, any>,
  palette: ProjectPalette
): google.maps.PolygonOptions => {
  const base = mapConfig.speakerDisplayDefaults ?? {};
  // As the app does: a speaker without colors of its own takes the first
  // palette color (a [fill, border] pair, or one color).
  const first = mapConfig.speakerPolygonColors?.[0];
  const fallback = resolveColor(Array.isArray(first) ? first[0] : first, palette) ?? palette.primary;
  const fill = resolveColor(speaker.fill_color, palette) ?? fallback;
  const stroke = resolveColor(speaker.border_color, palette) ?? fill;
  const s: Partial<StateStyle> =
    mapConfig.speakerStateStyles?.[state] ?? mapConfig.speakerStateStyles?.idle ?? {};
  return {
    clickable: false,
    fillColor: resolveColor(s.fill_color, palette) ?? fill,
    fillOpacity: s.fill_opacity ?? base.fillOpacity ?? 0.25,
    strokeColor: resolveColor(s.stroke_color, palette) ?? stroke,
    strokeOpacity: s.stroke_opacity ?? base.strokeOpacity ?? 1,
    strokeWeight: s.stroke_weight ?? base.strokeWeight ?? 2,
  };
};
