// ---------------------------------------------------------------------------
// Step 3 — Audiotrack configuration
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import {
  Box,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { WizardState } from "../types";
import { WizardAction } from "../wizardReducer";
import StepInstruction from "../components/StepInstruction";
import WizardRangeSlider from "../components/WizardRangeSlider";

interface AudiotrackStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const AudiotrackStep: React.FC<AudiotrackStepProps> = ({ state, dispatch }) => {
  const { audiotrack } = state;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<typeof audiotrack>) =>
    dispatch({ type: "UPDATE_AUDIOTRACK", patch });

  return (
    <Box>
      <StepInstruction title="Audiotrack Settings">
        An audiotrack controls how audio assets are mixed and played back.
        Every project needs at least one. The defaults below work well for
        most projects — adjust if you have specific mixing needs.
      </StepInstruction>

      <Grid container spacing={3}>
        {/* Volume */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <WizardRangeSlider
            label="Volume"
            minValue={audiotrack.min_volume}
            maxValue={audiotrack.max_volume}
            onChange={(min, max) =>
              update({ min_volume: min, max_volume: max })
            }
            min={0}
            max={1}
            step={0.05}
          />
        </Grid>

        {/* Duration */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <WizardRangeSlider
            label="Duration (sec)"
            minValue={audiotrack.min_duration}
            maxValue={audiotrack.max_duration}
            onChange={(min, max) =>
              update({ min_duration: min, max_duration: max })
            }
            min={0}
            max={300}
            step={1}
          />
        </Grid>

        {/* Dead Air */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <WizardRangeSlider
            label="Dead Air (sec)"
            minValue={audiotrack.min_dead_air}
            maxValue={audiotrack.max_dead_air}
            onChange={(min, max) =>
              update({ min_dead_air: min, max_dead_air: max })
            }
            min={0}
            max={60}
            step={0.5}
          />
        </Grid>

        {/* Timed Asset Priority is deliberately not shown here. It only means
            anything once timed assets exist, and it belongs on the form where
            those are added — which is still to be built. The default "normal"
            travels with the audiotrack either way. */}

        {/* Advanced Toggle */}
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="Show advanced audiotrack settings"
          />
        </Grid>

        {showAdvanced && (
          <>
            {/* Fade In */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <WizardRangeSlider
                label="Fade In Time (sec)"
                minValue={audiotrack.min_fade_in_time}
                maxValue={audiotrack.max_fade_in_time}
                onChange={(min, max) =>
                  update({ min_fade_in_time: min, max_fade_in_time: max })
                }
                min={0}
                max={10}
                step={0.1}
              />
            </Grid>

            {/* Fade Out */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <WizardRangeSlider
                label="Fade Out Time (sec)"
                minValue={audiotrack.min_fade_out_time}
                maxValue={audiotrack.max_fade_out_time}
                onChange={(min, max) =>
                  update({
                    min_fade_out_time: min,
                    max_fade_out_time: max,
                  })
                }
                min={0}
                max={10}
                step={0.1}
              />
            </Grid>

            {/* Pan Position */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <WizardRangeSlider
                label="Pan Position"
                minValue={audiotrack.min_pan_pos}
                maxValue={audiotrack.max_pan_pos}
                onChange={(min, max) =>
                  update({ min_pan_pos: min, max_pan_pos: max })
                }
                min={-1}
                max={1}
                step={0.1}
              />
            </Grid>

            {/* Pan Duration */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <WizardRangeSlider
                label="Pan Duration (sec)"
                minValue={audiotrack.min_pan_duration}
                maxValue={audiotrack.max_pan_duration}
                onChange={(min, max) =>
                  update({
                    min_pan_duration: min,
                    max_pan_duration: max,
                  })
                }
                min={0}
                max={60}
                step={0.5}
              />
            </Grid>

            {/* Banned Duration */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Banned Duration (sec)"
                type="number"
                value={audiotrack.banned_duration}
                onChange={(e) =>
                  update({ banned_duration: parseInt(e.target.value) || 0 })
                }
                fullWidth
                helperText="Time after playing before an asset can play again."
              />
            </Grid>

            {/* Boolean flags */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                Playback Options
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={audiotrack.repeat_recordings}
                        onChange={(e) =>
                          update({ repeat_recordings: e.target.checked })
                        }
                        size="small"
                      />
                    }
                    label="Repeat"
                    title="Can an asset play more than once in this audiotrack?"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={audiotrack.start_with_silence}
                        onChange={(e) =>
                          update({ start_with_silence: e.target.checked })
                        }
                        size="small"
                      />
                    }
                    label="Start Silent"
                    title="Should this audiotrack begin with silence for the dead air duration or play an asset immediately?"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={audiotrack.fadeout_when_filtered}
                        onChange={(e) =>
                          update({
                            fadeout_when_filtered: e.target.checked,
                          })
                        }
                        size="small"
                      />
                    }
                    label="Fadeout When Filtered"
                    title="Should an asset playing in this audiotrack fadeout if it becomes unavailable while playing e.g. listener leaving active range."
                  />
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AudiotrackStep;
