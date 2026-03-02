// ---------------------------------------------------------------------------
// Step 5 — UI Group configuration per tag category
// ---------------------------------------------------------------------------
import React, { useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { WizardState, TempId } from "../types";
import { WizardAction } from "../wizardReducer";
import StepInstruction from "../components/StepInstruction";

interface UIBuilderStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const UI_MODES = [
  { value: "listen", label: "Listen" },
  { value: "speak", label: "Speak" },
  { value: "browse", label: "Browse" },
];

const SELECT_TYPES = [
  { value: "single", label: "Single Select" },
  { value: "multi", label: "Multi Select" },
  { value: "min_one", label: "At Least One" },
];

const UIBuilderStep: React.FC<UIBuilderStepProps> = ({ state, dispatch }) => {
  const { categories, tags, uiGroups } = state;

  // Auto-create UI groups for categories that don't have one yet
  useEffect(() => {
    for (const cat of categories) {
      const existing = uiGroups.find((g) => g.categoryTempId === cat.tempId);
      if (!existing) {
        const categoryTags = tags.filter(
          (t) => t.categoryTempId === cat.tempId
        );
        dispatch({
          type: "ADD_UI_GROUP",
          group: {
            name: cat.name,
            header_text: "",
            ui_mode: "speak",
            select_type: "single",
            is_active: true,
            categoryTempId: cat.tempId,
            tagTempIds: categoryTags.map((t) => t.tempId),
          },
        });
      }
    }
  }, [categories, tags, uiGroups, dispatch]);

  const toggleTag = (groupTempId: TempId, tagTempId: TempId) => {
    const group = uiGroups.find((g) => g.tempId === groupTempId);
    if (!group) return;
    const has = group.tagTempIds.includes(tagTempId);
    dispatch({
      type: "UPDATE_UI_GROUP",
      tempId: groupTempId,
      patch: {
        tagTempIds: has
          ? group.tagTempIds.filter((id) => id !== tagTempId)
          : [...group.tagTempIds, tagTempId],
      },
    });
  };

  if (categories.length === 0) {
    return (
      <Box>
        <StepInstruction title="UI Builder">
          You need to create tag categories in the previous step before
          configuring the UI.
        </StepInstruction>
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          Go back to the Content Tags step and add at least one category.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <StepInstruction title="UI Builder">
        Each tag category gets a UI group that controls how tags are
        presented to participants. Configure the display mode, selection
        type, and choose which tags to include.
      </StepInstruction>

      {categories.map((cat) => {
        const group = uiGroups.find((g) => g.categoryTempId === cat.tempId);
        const categoryTags = tags.filter(
          (t) => t.categoryTempId === cat.tempId
        );
        if (!group) return null;

        return (
          <Card key={cat.tempId} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {cat.name || "Unnamed Category"}
              </Typography>

              <Grid container spacing={2}>
                {/* Group Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="UI Group Name"
                    value={group.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_UI_GROUP",
                        tempId: group.tempId,
                        patch: { name: e.target.value },
                      })
                    }
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>

                {/* Header Text */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Header Text"
                    value={group.header_text}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_UI_GROUP",
                        tempId: group.tempId,
                        patch: { header_text: e.target.value },
                      })
                    }
                    fullWidth
                    size="small"
                    helperText="Question shown to participants (e.g. 'What kind of sound?')"
                  />
                </Grid>

                {/* UI Mode */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="Mode"
                    select
                    value={group.ui_mode}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_UI_GROUP",
                        tempId: group.tempId,
                        patch: { ui_mode: e.target.value },
                      })
                    }
                    fullWidth
                    size="small"
                  >
                    {UI_MODES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Select Type */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="Selection Type"
                    select
                    value={group.select_type}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_UI_GROUP",
                        tempId: group.tempId,
                        patch: { select_type: e.target.value },
                      })
                    }
                    fullWidth
                    size="small"
                  >
                    {SELECT_TYPES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Active */}
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={group.is_active}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_UI_GROUP",
                            tempId: group.tempId,
                            patch: { is_active: e.target.checked },
                          })
                        }
                        size="small"
                      />
                    }
                    label="Active"
                  />
                </Grid>

                {/* Tag Selection */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags to include:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {categoryTags.map((tag) => {
                      const included = group.tagTempIds.includes(tag.tempId);
                      return (
                        <Chip
                          key={tag.tempId}
                          label={tag.value || "Unnamed"}
                          color={included ? "primary" : "default"}
                          variant={included ? "filled" : "outlined"}
                          onClick={() =>
                            toggleTag(group.tempId, tag.tempId)
                          }
                          size="small"
                        />
                      );
                    })}
                    {categoryTags.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No tags in this category. Go back and add some.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default UIBuilderStep;
