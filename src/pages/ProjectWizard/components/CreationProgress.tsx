// ---------------------------------------------------------------------------
// Creation progress dialog — shows step-by-step API creation progress
// ---------------------------------------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { CreationStep, WizardState } from "../types";
import { executeCreation } from "../createProject";

interface CreationProgressProps {
  state: WizardState;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}

const CreationProgress: React.FC<CreationProgressProps> = ({
  state,
  open,
  onClose,
  onDone,
}) => {
  const [steps, setSteps] = useState<CreationStep[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Ensure we only execute once — survives StrictMode double-mount.
  const hasStartedRef = useRef(false);

  // The new project is deliberately *not* selected here. Selecting it made
  // ProjectRoute remount the whole admin while the address was still
  // /wizard, which unmounted this dialog before anyone could click it and
  // left an empty wizard on screen. Every button below loads the new
  // project's page afresh, which selects it from the address.
  const run = async () => {
    hasStartedRef.current = true;
    setDone(false);
    setError(null);
    setSteps([]);
    try {
      const newProjectId = await executeCreation(state, setSteps);
      setProjectId(newProjectId);
      setDone(true);
      onDoneRef.current?.();
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    if (!open || hasStartedRef.current) return;
    run();
  }, [open, state]);

  // A full page load, not `navigate()`: the admin's router is based on the
  // selected project (`/project/:id`), and a fresh load both selects the new
  // project and fetches its data rather than reusing what the wizard left.
  const goTo = (suffix: string) => () => {
    if (projectId) {
      window.location.assign(`/project/${projectId}${suffix}`);
      return;
    }
    onClose();
  };

  // Only asset-paradigm projects are pointed at the assets page. In a looping
  // project a contribution becomes a *speaker*, not an asset, so there is
  // nothing to add there — its equivalent prompt is the base-loop warning on
  // the Publish page.
  const collectsAssets = state.project.recording_method !== "looping";

  const nextSteps: { label: string; text: string; onClick: () => void }[] = [
    ...(collectsAssets
      ? [
          {
            label: "Add audio",
            text:
              "Upload recordings for participants to hear. Participants can contribute their own, " +
              "but most projects start with something to listen to.",
            onClick: goTo("/assets"),
          },
        ]
      : []),
    {
      label: "Look & Feel",
      text: "Set your project's colors, font, logo, images and wording. The preview shows exactly what participants will see.",
      onClick: goTo("/customize"),
    },
    {
      label: "Publish",
      text: "Choose a web address and put your project online when you're ready.",
      onClick: goTo("/publish"),
    },
    {
      label: "Project dashboard",
      text: "Your project's activity and usage. Everything else is in the menu on the left.",
      onClick: goTo(""),
    },
  ];

  return (
    // Not dismissible once created: the choices below are the way out.
    <Dialog open={open} onClose={error ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {done ? "Project Created!" : error ? "Creation Failed" : "Creating Project..."}
      </DialogTitle>
      <DialogContent>
        {done ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircleIcon color="success" />
            <Typography variant="body2">
              All {steps.length} steps completed.
            </Typography>
          </Stack>
        ) : (
          <List dense>
            {steps.map((step, i) => (
              <ListItem key={i}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {step.status === "completed" && (
                    <CheckCircleIcon color="success" />
                  )}
                  {step.status === "in_progress" && (
                    <CircularProgress size={20} />
                  )}
                  {step.status === "error" && <ErrorIcon color="error" />}
                  {step.status === "pending" && (
                    <RadioButtonUncheckedIcon color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={step.label}
                  secondary={step.error || undefined}
                  secondaryTypographyProps={{ color: "error" }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error" variant="body2">
              An error occurred during creation. Resources created before the
              error were saved and can be managed from the admin interface.
            </Typography>
          </Box>
        )}

        {done && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Next steps
            </Typography>
            <Stack spacing={2} divider={<Divider flexItem />}>
              {nextSteps.map((step, i) => (
                <Stack
                  key={step.label}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                >
                  <Button
                    variant={i === 0 ? "contained" : "outlined"}
                    onClick={step.onClick}
                    sx={{ minWidth: 170, flexShrink: 0 }}
                  >
                    {step.label}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {step.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>
      {!done && (
        <DialogActions>
          {error ? (
            <>
              <Button onClick={onClose}>Close</Button>
              <Button onClick={run} variant="contained">
                Retry
              </Button>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              Please wait...
            </Typography>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CreationProgress;
