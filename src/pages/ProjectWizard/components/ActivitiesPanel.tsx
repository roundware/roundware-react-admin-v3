// ---------------------------------------------------------------------------
// Project Setup Wizard — What people do here (on Project Basics)
// ---------------------------------------------------------------------------
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { STEP_LABELS, WizardProject, WizardState } from "../types";
import { WizardAction } from "../wizardReducer";
import { isLooping, visibleSteps } from "../wizardSteps";

/** A setting under Listen or Speak, with what it does. */
const Detail: React.FC<{
  label: string;
  help: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, help, checked, disabled, onChange }) => (
  <Box sx={{ ml: 4 }}>
    <FormControlLabel
      control={<Checkbox size="small" checked={checked && !disabled} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />}
      label={<Typography variant="body2">{label}</Typography>}
    />
    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: -0.5 }}>
      {help}
    </Typography>
  </Box>
);

/**
 * What people do in the project: Listen, Speak, or both, and how — on
 * Project Basics, filled in by the template and changeable. Every step that
 * depends on them comes after (wizardSteps.ts), so changing them hides or
 * brings back later steps without losing what was entered.
 */
const ActivitiesPanel: React.FC<{
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}> = ({ state, dispatch }) => {
  const { project } = state;
  const update = (patch: Partial<WizardProject>) => dispatch({ type: "UPDATE_PROJECT", patch });
  const looping = isLooping(state);
  const steps = visibleSteps(state).filter((s) => s !== "template");

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">What will people do here?</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set by the template — change them to suit. The steps that follow adapt to these, and
          you can come back and change them any time before creating the project.
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={project.listen_enabled}
                  disabled={looping}
                  onChange={(e) => update({ listen_enabled: e.target.checked })}
                />
              }
              label={<Typography variant="subtitle1">Listen</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mb: 1 }}>
              {looping
                ? "Always on in a looping project: contributors record over what they hear."
                : "Hear recordings, on the map or out walking."}
            </Typography>
            <Detail
              label="Use each listener's location"
              help="What's heard follows where they are. Off, they choose a spot on the map."
              checked={project.geo_listen_enabled}
              disabled={!project.listen_enabled}
              onChange={(c) => update({ geo_listen_enabled: c })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch checked={project.speak_enabled} onChange={(e) => update({ speak_enabled: e.target.checked })} />
              }
              label={<Typography variant="subtitle1">Speak</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mb: 1 }}>
              Record and send in their own.
            </Typography>
            <Detail
              label="Record where each contribution was made"
              help="Each recording is placed where the contributor is, when their device allows."
              checked={project.geo_speak_enabled}
              disabled={!project.speak_enabled}
              onChange={(c) => update({ geo_speak_enabled: c })}
            />
            <Detail
              label="Ask contributors to tag their recording"
              help="With the questions you set in Filters & Menus."
              checked={project.allow_speak_tags}
              disabled={!project.speak_enabled}
              onChange={(c) => update({ allow_speak_tags: c })}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Your steps:
          </Typography>
          {steps.map((s) => (
            <Chip
              key={s}
              size="small"
              variant="outlined"
              label={s === "embed" ? `${STEP_LABELS[s]} (optional)` : STEP_LABELS[s]}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ActivitiesPanel;
