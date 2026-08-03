// ---------------------------------------------------------------------------
// Step 2 — Project Basics (name, description, location, languages, settings)
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
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
import WizardLocationSelector from "../components/WizardLocationSelector";
import WizardTranslatableField from "../components/WizardTranslatableField";
import { apiFetcher } from "../../../roundwareDataProvider/tokenAuthProvider";

interface ProjectStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

interface LanguageOption {
  id: number;
  language_code: string;
  name: string;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ state, dispatch }) => {
  const { project } = state;
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch available languages on mount
  useEffect(() => {
    let cancelled = false;
    apiFetcher("/languages/")
      .then(({ json }) => {
        if (cancelled) return;
        const langs = Array.isArray(json) ? json : json?.results ?? json?.data ?? [];
        setLanguages(langs);
      })
      .catch((e: unknown) => console.error("Failed to load languages:", e));
    return () => { cancelled = true; };
  }, []);

  const update = (patch: Partial<typeof project>) =>
    dispatch({ type: "UPDATE_PROJECT", patch });

  // Preserve user selection order: map from language_ids (not filter from API order)
  const selectedLangs = useMemo(
    () =>
      project.language_ids
        .map((id) => languages.find((l) => l.id === id))
        .filter((l): l is LanguageOption => l !== undefined),
    [languages, project.language_ids]
  );

  const handleReorderLanguages = useCallback(
    (reorderedLangs: LanguageOption[]) => {
      dispatch({ type: "UPDATE_PROJECT", patch: { language_ids: reorderedLangs.map((l) => l.id) } });
    },
    [dispatch]
  );

  return (
    <Box>
      <StepInstruction title="Project Basics">
        Name your project, set its location on the map, and choose which
        languages it will support. The location determines the default map
        center for participants.
      </StepInstruction>

      <Grid container spacing={3}>
        {/* Name */}
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Project Name"
            value={project.name}
            onChange={(e) => update({ name: e.target.value })}
            fullWidth
            required
            helperText="A short, descriptive name for your project."
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Description"
            value={project.description}
            onChange={(e) => update({ description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            helperText="Describe the project for participants and collaborators."
          />
        </Grid>

        {/* Location */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Project Location
          </Typography>
          <WizardLocationSelector
            latitude={project.latitude}
            longitude={project.longitude}
            onChange={(lat, lng) =>
              update({ latitude: lat, longitude: lng })
            }
          />
        </Grid>

        {/* Languages */}
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            multiple
            options={languages}
            value={selectedLangs}
            getOptionLabel={(opt) =>
              `${opt.name} (${opt.language_code})`
            }
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            onChange={(_, newVal) => {
              // Preserve existing order: keep current IDs in order, append new ones
              const newIds = newVal.map((l) => l.id);
              const kept = project.language_ids.filter((id) => newIds.includes(id));
              const added = newIds.filter((id) => !kept.includes(id));
              update({ language_ids: [...kept, ...added] });
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...rest } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={`${option.name} (${option.language_code})`}
                    size="small"
                    {...rest}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Languages"
                required
                helperText="Select at least one language for your project."
              />
            )}
          />
        </Grid>

        {/* Key Settings */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" gutterBottom>
            Key Settings
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Max Recording (sec)"
                type="number"
                value={project.max_recording_length_sec}
                onChange={(e) =>
                  update({
                    max_recording_length_sec: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Recording Radius (m)"
                type="number"
                value={project.recording_radius ?? ""}
                onChange={(e) =>
                  update({
                    recording_radius: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                fullWidth
                size="small"
                required
                helperText="Meters around listener for audio playback"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.auto_submit}
                    onChange={(e) =>
                      update({ auto_submit: e.target.checked })
                    }
                  />
                }
                label="Auto-submit recordings"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Toggles */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.listen_enabled}
                    onChange={(e) =>
                      update({ listen_enabled: e.target.checked })
                    }
                  />
                }
                label="Listen"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.geo_listen_enabled}
                    onChange={(e) =>
                      update({ geo_listen_enabled: e.target.checked })
                    }
                  />
                }
                label="Geo Listen"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.speak_enabled}
                    onChange={(e) =>
                      update({ speak_enabled: e.target.checked })
                    }
                  />
                }
                label="Speak"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.geo_speak_enabled}
                    onChange={(e) =>
                      update({ geo_speak_enabled: e.target.checked })
                    }
                  />
                }
                label="Geo Speak"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Legal Agreement — with language tabs when multiple languages selected */}
        <Grid size={{ xs: 12 }}>
          <WizardTranslatableField
            label="Legal Agreement"
            defaultValue={project.legal_agreement}
            onDefaultChange={(val) => update({ legal_agreement: val })}
            localizations={project.localizations}
            onLocalizationsChange={(loc) => update({ localizations: loc })}
            fieldName="legal_agreement"
            languages={selectedLangs}
            onReorderLanguages={handleReorderLanguages}
            multiline
            rows={2}
            helperText="Agreement text shown to participants before they contribute."
          />
        </Grid>

        {/* Advanced toggle */}
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="Show advanced settings"
          />
        </Grid>

        {showAdvanced && (
          <>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Ordering"
                select
                value={project.ordering}
                onChange={(e) => update({ ordering: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="random">Random</MenuItem>
                <MenuItem value="by_like">By Likes</MenuItem>
                <MenuItem value="by_weight">By Weight</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Repeat Mode"
                select
                value={project.repeat_mode}
                onChange={(e) => update({ repeat_mode: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="stop">Stop</MenuItem>
                <MenuItem value="continuous">Continuous</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Out of Range Distance"
                type="number"
                value={project.out_of_range_distance}
                onChange={(e) =>
                  update({
                    out_of_range_distance: parseFloat(e.target.value) || 0,
                  })
                }
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Sharing URL"
                value={project.sharing_url}
                onChange={(e) => update({ sharing_url: e.target.value })}
                fullWidth
                size="small"
                helperText="Optional URL for project sharing page"
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default ProjectStep;
