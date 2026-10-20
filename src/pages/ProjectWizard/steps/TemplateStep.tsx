// ---------------------------------------------------------------------------
// Step 1 — Choose a starting template
// ---------------------------------------------------------------------------
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import MapIcon from "@mui/icons-material/Map";
import PaletteIcon from "@mui/icons-material/Palette";
import TuneIcon from "@mui/icons-material/Tune";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import BuildIcon from "@mui/icons-material/Build";

import { STEP_LABELS, WizardProject, WizardState } from "../types";
import { isLooping, visibleSteps } from "../wizardSteps";
import { WizardAction } from "../wizardReducer";
import { ACTIVE_TEMPLATES, DEFAULT_TEMPLATE } from "../templates";
import StepInstruction from "../components/StepInstruction";

interface TemplateStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const iconMap: Record<string, React.ReactElement> = {
  DirectionsWalk: <DirectionsWalkIcon sx={{ fontSize: 48 }} />,
  RecordVoiceOver: <RecordVoiceOverIcon sx={{ fontSize: 48 }} />,
  Map: <MapIcon sx={{ fontSize: 48 }} />,
  Palette: <PaletteIcon sx={{ fontSize: 48 }} />,
  Tune: <TuneIcon sx={{ fontSize: 48 }} />,
  Podcasts: <PodcastsIcon sx={{ fontSize: 48 }} />,
  GraphicEq: <GraphicEqIcon sx={{ fontSize: 48 }} />,
  Feedback: <FeedbackIcon sx={{ fontSize: 48 }} />,
};

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
 * What people do in the project: Listen, Speak, or both, and how. Filled in
 * by the template and changeable; the steps after follow them (wizardSteps.ts),
 * and coming back to change them hides or brings back steps without losing
 * what was entered.
 */
const ActivitiesPanel: React.FC<TemplateStepProps> = ({ state, dispatch }) => {
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

const TemplateStep: React.FC<TemplateStepProps> = ({ state, dispatch }) => {
  // Choosing a template brings what people do into view, just below.
  const activities = useRef<HTMLDivElement | null>(null);
  const chosen = useRef(state.templateKey);
  useEffect(() => {
    if (state.templateKey && state.templateKey !== chosen.current) {
      activities.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    chosen.current = state.templateKey;
  }, [state.templateKey]);

  return (
    <Box>
      <StepInstruction title="Choose a Starting Point">
        Every template pre-fills your project with working defaults — tags,
        recording settings and app behavior — so you have something coherent
        from the start. Then say what people will do in it, and the wizard
        shows only the steps it needs. Nothing here is permanent; you can
        change any setting in the later steps or after the project is created.
      </StepInstruction>

      {ACTIVE_TEMPLATES.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No project templates are currently available. Every template has been
          set to <code>active: false</code>, so there is nothing to choose from
          and the wizard cannot continue.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {ACTIVE_TEMPLATES.map((template) => {
          const isSelected = state.templateKey === template.key;
          return (
            <Grid key={template.key} size={{ xs: 12, sm: 6 }}>
              <Card
                variant={isSelected ? "elevation" : "outlined"}
                sx={{
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? "primary.main" : "divider",
                  height: "100%",
                }}
              >
                <CardActionArea
                  onClick={() =>
                    dispatch({ type: "APPLY_TEMPLATE", template })
                  }
                  sx={{ height: "100%", p: 2 }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ color: isSelected ? "primary.main" : "text.secondary" }}>
                      {iconMap[template.icon] || <BuildIcon sx={{ fontSize: 48 }} />}
                    </Box>
                    <Typography variant="h6">{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
                      {template.categories.map((c, i) => (
                        <Chip key={i} label={c.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                    {isSelected && (
                      <Chip
                        label="Selected"
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {state.templateKey !== null && (
        <Box ref={activities}>
          <ActivitiesPanel state={state} dispatch={dispatch} />
        </Box>
      )}

      {state.templateKey === null && ACTIVE_TEMPLATES.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 1 }}
        >
          Choose a template to continue. Every setting can be changed later
          {DEFAULT_TEMPLATE && (
            <>
              {" "}
              — pick <strong>{DEFAULT_TEMPLATE.name}</strong> if you are not sure
            </>
          )}
          .
        </Typography>
      )}
    </Box>
  );
};

export default TemplateStep;
