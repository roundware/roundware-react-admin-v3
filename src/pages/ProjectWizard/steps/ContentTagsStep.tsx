// ---------------------------------------------------------------------------
// Step 4 — Tag categories + tags within each category
// ---------------------------------------------------------------------------
import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { WizardState, WizardTag, TempId } from "../types";
import { WizardAction } from "../wizardReducer";
import StepInstruction from "../components/StepInstruction";

interface ContentTagsStepProps {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}

const ContentTagsStep: React.FC<ContentTagsStepProps> = ({ state, dispatch }) => {
  const { categories, tags } = state;

  const addCategory = () => {
    dispatch({
      type: "ADD_CATEGORY",
      category: { name: "", data: "" },
    });
  };

  const addTag = (categoryTempId: TempId) => {
    dispatch({
      type: "ADD_TAG",
      tag: {
        value: "",
        description: "",
        filter: "",
        data: "",
        categoryTempId,
      },
    });
  };

  const tagsForCategory = (categoryTempId: TempId): WizardTag[] =>
    tags.filter((t) => t.categoryTempId === categoryTempId);

  return (
    <Box>
      <StepInstruction title="Content Tags">
        Tags let participants categorize their recordings. Organize tags into
        categories (e.g. &quot;Sound Type&quot;, &quot;Mood&quot;). Each category becomes a
        question or filter group in the participant UI.
        <br />
        <strong>Note:</strong> Tag categories are shared across all projects in
        your tenant. Tags themselves are project-scoped.
      </StepInstruction>

      {categories.length === 0 && (
        <Typography
          color="text.secondary"
          sx={{ textAlign: "center", py: 4 }}
        >
          No categories yet. Add one to get started.
        </Typography>
      )}

      {categories.map((cat) => (
        <Accordion key={cat.tempId} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <TextField
                label="Category Name"
                value={cat.name}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_CATEGORY",
                    tempId: cat.tempId,
                    patch: { name: e.target.value },
                  })
                }
                size="small"
                required
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                sx={{ flex: 1, maxWidth: 300 }}
              />
              <Chip
                label={`${tagsForCategory(cat.tempId).length} tags`}
                size="small"
                variant="outlined"
              />
              <IconButton
                color="error"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({
                    type: "REMOVE_CATEGORY",
                    tempId: cat.tempId,
                  });
                }}
                title="Remove category and its tags"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            {tagsForCategory(cat.tempId).length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                No tags in this category. Add one below.
              </Typography>
            )}

            {tagsForCategory(cat.tempId).map((tag) => (
              <Box
                key={tag.tempId}
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <TextField
                  label="Tag Name"
                  value={tag.value}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TAG",
                      tempId: tag.tempId,
                      patch: { value: e.target.value },
                    })
                  }
                  size="small"
                  required
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Description"
                  value={tag.description}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TAG",
                      tempId: tag.tempId,
                      patch: { description: e.target.value },
                    })
                  }
                  size="small"
                  sx={{ flex: 3 }}
                />
                <IconButton
                  color="error"
                  size="small"
                  onClick={() =>
                    dispatch({ type: "REMOVE_TAG", tempId: tag.tempId })
                  }
                  title="Remove tag"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddCircleOutlineIcon />}
              size="small"
              onClick={() => addTag(cat.tempId)}
              sx={{ mt: 1 }}
            >
              Add Tag
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={addCategory}
        >
          Add Category
        </Button>
      </Box>
    </Box>
  );
};

export default ContentTagsStep;
