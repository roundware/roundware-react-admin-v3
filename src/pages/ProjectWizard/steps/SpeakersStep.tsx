// ---------------------------------------------------------------------------
// Step 6 — Speakers (optional)
// ---------------------------------------------------------------------------
import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";

import { WizardState } from "../types";
import { WizardAction } from "../wizardReducer";
import StepInstruction from "../components/StepInstruction";

interface SpeakersStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const SpeakersStep: React.FC<SpeakersStepProps> = ({ state, dispatch }) => {
  const { speakers, skipSpeakers } = state;

  const addSpeaker = () => {
    dispatch({
      type: "ADD_SPEAKER",
      speaker: {
        code: "",
        is_active: true,
        attenuation_distance: 0,
        min_volume: 0.0,
        max_volume: 1.0,
        fill_color: "#0000FF80",
        border_color: "#0000FF",
      },
    });
  };

  return (
    <Box>
      <StepInstruction title="Speakers">
        Speakers define audio sources for background/ambient playback. They
        are optional and can also be added later from the Speakers page.
        Speaker shapes (map regions) can be drawn after creation.
      </StepInstruction>

      <FormControlLabel
        control={
          <Switch
            checked={skipSpeakers}
            onChange={(e) =>
              dispatch({ type: "SET_SKIP_SPEAKERS", skip: e.target.checked })
            }
          />
        }
        label="Skip speakers — I'll add them later"
        sx={{ mb: 2 }}
      />

      {!skipSpeakers && (
        <>
          {speakers.length === 0 && (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No speakers yet. Add one below.
            </Typography>
          )}

          {speakers.map((spk, index) => (
            <Card key={spk.tempId} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1">
                    Speaker {index + 1}
                  </Typography>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_SPEAKER",
                        tempId: spk.tempId,
                      })
                    }
                    title="Remove speaker"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Code"
                      value={spk.code}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: { code: e.target.value },
                        })
                      }
                      fullWidth
                      size="small"
                      required
                      inputProps={{ maxLength: 10 }}
                      helperText="Short identifier (max 10 chars)"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField
                      label="Attenuation Distance"
                      type="number"
                      value={spk.attenuation_distance}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: {
                            attenuation_distance:
                              parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={spk.is_active}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_SPEAKER",
                              tempId: spk.tempId,
                              patch: { is_active: e.target.checked },
                            })
                          }
                          size="small"
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Min Volume"
                      type="number"
                      value={spk.min_volume}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: {
                            min_volume: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      fullWidth
                      size="small"
                      inputProps={{ min: 0, max: 1, step: 0.05 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Max Volume"
                      type="number"
                      value={spk.max_volume}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: {
                            max_volume: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      fullWidth
                      size="small"
                      inputProps={{ min: 0, max: 1, step: 0.05 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Fill Color"
                      value={spk.fill_color}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: { fill_color: e.target.value },
                        })
                      }
                      fullWidth
                      size="small"
                      helperText="Hex color (e.g. #0000FF80)"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Border Color"
                      value={spk.border_color}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPEAKER",
                          tempId: spk.tempId,
                          patch: { border_color: e.target.value },
                        })
                      }
                      fullWidth
                      size="small"
                      helperText="Hex color (e.g. #0000FF)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={addSpeaker}
            >
              Add Speaker
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SpeakersStep;
