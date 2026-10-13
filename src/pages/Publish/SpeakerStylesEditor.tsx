import { Box, Button, MenuItem, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React from "react";
import type { ProjectPalette } from "../../hooks/useProjectPalette";
import { resolveColor, StateName, StateStyle, statesFor, StyleField } from "./speakerStates";

/**
 * How speakers look in each state (speakerStates.ts), for Map appearance.
 * Choosing a state draws every speaker on the map in it; its values can then
 * be changed. Each starts as the app's built-in value and goes back to it
 * with Reset — only what's changed is stored, as the project's override.
 */

export type StateOverrides = Partial<Record<StateName, Partial<StateStyle>>>;

interface Props {
  recordingMethod: string | undefined;
  selected: StateName;
  onSelect: (state: StateName) => void;
  /** The app's built-in state styles. */
  defaults: Record<StateName, StateStyle>;
  /** The base the built-ins' blanks inherit (map.speakerDisplayDefaults). */
  base: { fillOpacity: number; strokeOpacity: number; strokeWeight: number };
  overrides: StateOverrides;
  onChange: (overrides: StateOverrides) => void;
  palette: ProjectPalette;
}

const ROLES = [
  { value: "brand", label: "Brand" },
  { value: "backdrop", label: "Backdrop" },
  { value: "card", label: "Card" },
];

const SPEAKERS_OWN = "own";
const CUSTOM = "custom";

const ColorField = ({
  label,
  value,
  onChange,
  palette,
  ownLabel,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  palette: ProjectPalette;
  ownLabel: string;
}) => {
  const choice = value === null ? SPEAKERS_OWN : ROLES.some((r) => r.value === value) ? value : CUSTOM;
  const swatch = (color: string | null) => (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: "3px",
        border: 1,
        borderColor: "divider",
        bgcolor: color ?? "transparent",
        mr: 1,
        verticalAlign: "-2px",
      }}
    />
  );
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        select
        size="small"
        label={label}
        value={choice}
        onChange={(e) => {
          const v = e.target.value;
          if (v === SPEAKERS_OWN) onChange(null);
          else if (v === CUSTOM) onChange(resolveColor(value, palette) ?? palette.primary);
          else onChange(v);
        }}
        sx={{ flex: 1 }}
      >
        <MenuItem value={SPEAKERS_OWN}>{ownLabel}</MenuItem>
        {ROLES.map((r) => (
          <MenuItem key={r.value} value={r.value}>
            {swatch(resolveColor(r.value, palette))}
            {r.label}
          </MenuItem>
        ))}
        <MenuItem value={CUSTOM}>Another color</MenuItem>
      </TextField>
      {choice === CUSTOM && (
        <Box
          component="input"
          type="color"
          aria-label={`${label}: color`}
          value={resolveColor(value, palette) ?? "#000000"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          sx={{ width: 40, height: 36, p: 0, border: 0, background: "none", cursor: "pointer" }}
        />
      )}
    </Stack>
  );
};

const SpeakerStylesEditor: React.FC<Props> = ({
  recordingMethod,
  selected,
  onSelect,
  defaults,
  base,
  overrides,
  onChange,
  palette,
}) => {
  const states = statesFor(recordingMethod);
  const info = states.find((s) => s.name === selected) ?? states[0];
  const own = overrides[selected] ?? {};
  const isSet = (field: StyleField) => field in own;
  const valueOf = <F extends StyleField>(field: F): StateStyle[F] =>
    (isSet(field) ? own[field] : defaults[selected]?.[field] ?? null) as StateStyle[F];

  const set = (field: StyleField, value: string | number | null) =>
    onChange({ ...overrides, [selected]: { ...own, [field]: value } });
  const reset = (field: StyleField) => {
    const { [field]: _gone, ...rest } = own;
    const next = { ...overrides };
    if (Object.keys(rest).length) next[selected] = rest;
    else delete next[selected];
    onChange(next);
  };

  const ResetButton = ({ field }: { field: StyleField }) =>
    isSet(field) ? (
      <Button size="small" onClick={() => reset(field)} sx={{ minWidth: 0, px: 1 }}>
        Reset
      </Button>
    ) : null;

  const number = (field: StyleField, label: string, fallback: number, max: number, step: number, percent: boolean) => {
    const value = (valueOf(field) as number | null) ?? fallback;
    return (
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {label} — {percent ? `${Math.round(value * 100)}%` : `${value} px`}
            {!isSet(field) && " (built-in)"}
          </Typography>
          <ResetButton field={field} />
        </Stack>
        <Slider
          size="small"
          value={value}
          min={0}
          max={max}
          step={step}
          onChange={(_e, v) => set(field, v as number)}
          aria-label={label}
        />
      </Box>
    );
  };

  const color = (field: StyleField, label: string, ownLabel: string) => (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Box sx={{ flex: 1 }}>
        <ColorField
          label={isSet(field) ? label : `${label} (built-in)`}
          value={valueOf(field) as string | null}
          onChange={(v) => set(field, v)}
          palette={palette}
          ownLabel={ownLabel}
        />
      </Box>
      <ResetButton field={field} />
    </Stack>
  );

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Speaker styles
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={info.name}
        onChange={(_e, v: StateName | null) => v && onSelect(v)}
        sx={{ flexWrap: "wrap" }}
      >
        {states.map((s) => (
          <ToggleButton key={s.name} value={s.name} sx={{ px: 1.5 }}>
            {s.label}
            {overrides[s.name] && " •"}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, mb: 1.5 }}>
        {info.help} The map shows every speaker this way.
      </Typography>
      <Stack spacing={1.5}>
        {color("fill_color", "Fill color", "The speaker's own color")}
        {number("fill_opacity", "Fill opacity", base.fillOpacity, 1, 0.05, true)}
        {color("stroke_color", "Border color", "The speaker's own border color")}
        {number("stroke_opacity", "Border opacity", base.strokeOpacity, 1, 0.05, true)}
        {number("stroke_weight", "Border width", base.strokeWeight, 8, 0.5, false)}
      </Stack>
    </Box>
  );
};

export default SpeakerStylesEditor;
