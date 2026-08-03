// ---------------------------------------------------------------------------
// Step 5 — UI Group configuration per tag category
// ---------------------------------------------------------------------------
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Button,
  Stack,
  Tab,
  Tabs,
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
];

const SELECT_TYPES = [
  { value: "single", label: "Single Select" },
  { value: "multi", label: "Multi Select" },
  { value: "min_one", label: "At Least One" },
];

const UIBuilderStep: React.FC<UIBuilderStepProps> = ({ state, dispatch }) => {
  const { categories, tags, uiGroups } = state;
  const [mode, setMode] = useState<"listen" | "speak">("speak");

  // Auto-create groups for a category the author added themselves — one for
  // each mode, since a new category is usually worth both tagging and
  // filtering by.
  //
  // Deliberately keyed on "has no group in *any* mode" rather than "has no
  // group in this mode". Templates declare their own groups per mode, and some
  // are speak-only on purpose (Podcast captures metadata but exposes no
  // filters; Collective Loops has no assets to filter). Creating the missing
  // counterpart would silently undo that intent.
  useEffect(() => {
    for (const cat of categories) {
      const anyGroup = uiGroups.some((g) => g.categoryTempId === cat.tempId);
      if (anyGroup) continue;

      const categoryTags = tags.filter((t) => t.categoryTempId === cat.tempId);
      for (const mode of ["speak", "listen"]) {
        dispatch({
          type: "ADD_UI_GROUP",
          group: {
            name: cat.name,
            header_text: "",
            ui_mode: mode,
            // Tagging an upload is usually one value; filtering playback is
            // usually several.
            select_type: mode === "listen" ? "multi" : "single",
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
        <strong>Speak</strong> groups let contributors tag their uploads with
        metadata. <strong>Listen</strong> groups let people filter what they
        hear by that same metadata. Usually you want both, but not always — a
        project might collect more about a contribution than is worth exposing
        as a filter, and some projects only ever do one or the other.
      </StepInstruction>

      <Tabs
        value={mode}
        onChange={(_e, v) => setMode(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {UI_MODES.map((m) => {
          const count = uiGroups.filter(
            (g) => g.ui_mode === m.value && g.is_active
          ).length;
          return (
            <Tab
              key={m.value}
              value={m.value}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{m.label}</span>
                  <Chip size="small" label={count} />
                </Stack>
              }
            />
          );
        })}
      </Tabs>

      {categories.map((cat) => {
        const group = uiGroups.find(
          (g) => g.categoryTempId === cat.tempId && g.ui_mode === mode
        );
        const categoryTags = tags.filter(
          (t) => t.categoryTempId === cat.tempId
        );

        // A category with no group in this mode is a deliberate state, not a
        // gap — offer to add one rather than creating it behind the author's
        // back.
        if (!group) {
          return (
            <Card key={cat.tempId} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                >
                  <Box>
                    <Typography variant="h6">
                      {cat.name || "Unnamed Category"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mode === "listen"
                        ? "Not offered as a listening filter."
                        : "Contributors are not asked to tag with this."}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      dispatch({
                        type: "ADD_UI_GROUP",
                        group: {
                          name: cat.name,
                          header_text: "",
                          ui_mode: mode,
                          select_type: mode === "listen" ? "multi" : "single",
                          is_active: true,
                          categoryTempId: cat.tempId,
                          tagTempIds: categoryTags.map((t) => t.tempId),
                        },
                      })
                    }
                  >
                    Add to {mode === "listen" ? "Listen" : "Speak"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        }

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
                    helperText={
                      mode === "listen"
                        ? "Filter label shown to listeners (e.g. 'Filter by mood')"
                        : "Question asked when tagging an upload (e.g. 'What kind of sound?')"
                    }
                  />
                </Grid>


                {/* Select Type */}
                <Grid size={{ xs: 6, sm: 6 }}>
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
                <Grid size={{ xs: 6, sm: 6 }}>
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
