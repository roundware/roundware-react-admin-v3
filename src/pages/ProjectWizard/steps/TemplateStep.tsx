// ---------------------------------------------------------------------------
// Step 1 — Choose a starting template or start from scratch
// ---------------------------------------------------------------------------
import React from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import MapIcon from "@mui/icons-material/Map";
import PaletteIcon from "@mui/icons-material/Palette";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import BuildIcon from "@mui/icons-material/Build";

import { WizardState } from "../types";
import { WizardAction } from "../wizardReducer";
import { TEMPLATES } from "../templates";
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
  Podcasts: <PodcastsIcon sx={{ fontSize: 48 }} />,
  GraphicEq: <GraphicEqIcon sx={{ fontSize: 48 }} />,
};

const TemplateStep: React.FC<TemplateStepProps> = ({ state, dispatch }) => {
  return (
    <Box>
      <StepInstruction title="Choose a Starting Point">
        Pick a template to pre-fill your project with sensible defaults, or
        start from scratch to configure everything yourself. You can always
        change any setting in later steps.
      </StepInstruction>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {TEMPLATES.map((template) => {
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

      {/* Start from Scratch */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant={state.templateKey === null ? "contained" : "outlined"}
          size="large"
          startIcon={<BuildIcon />}
          onClick={() => dispatch({ type: "CLEAR_TEMPLATE" })}
        >
          Start from Scratch
        </Button>
        {state.templateKey === null && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click &quot;Next&quot; to begin configuring your project manually.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TemplateStep;
