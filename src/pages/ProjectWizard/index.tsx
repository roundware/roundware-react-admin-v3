// ---------------------------------------------------------------------------
// Project Setup Wizard — Main Page
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useReducer, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { Title } from "react-admin";

import { WIZARD_STEPS, STEP_LABELS, WizardStepId } from "./types";
import { wizardReducer, INITIAL_STATE, WizardAction } from "./wizardReducer";
import { validateStep } from "./wizardValidation";
import { useCallbackPrompt } from "../../hooks/useCallbackPrompt";
import TemplateStep from "./steps/TemplateStep";
import ProjectStep from "./steps/ProjectStep";
import AudiotrackStep from "./steps/AudiotrackStep";
import ContentTagsStep from "./steps/ContentTagsStep";
import UIBuilderStep from "./steps/UIBuilderStep";
import SpeakersStep from "./steps/SpeakersStep";
import CreationProgress from "./components/CreationProgress";

const ProjectWizardPage: React.FC = () => {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const [showCreation, setShowCreation] = useState(false);
  const [creationDone, setCreationDone] = useState(false);

  // Determine if the wizard has unsaved work (user has moved past template step)
  const hasUnsavedWork = state.activeStep > 0 && !creationDone;

  // Block in-app navigation (React Router) when there's unsaved work
  const [showNavPrompt, confirmNavigation, cancelNavigation] =
    useCallbackPrompt(hasUnsavedWork);

  // Block browser-level navigation (refresh, close tab, back/forward)
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  const currentStepId: WizardStepId = WIZARD_STEPS[state.activeStep];
  const validation = validateStep(currentStepId, state);

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const handleBack = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const handleStepClick = useCallback((index: number) => {
    dispatch({ type: "SET_STEP", step: index });
  }, []);

  const handleCreate = useCallback(() => {
    setShowCreation(true);
  }, []);

  const handleCreationClose = useCallback(() => {
    setShowCreation(false);
  }, []);

  const handleCreationDone = useCallback(() => {
    setCreationDone(true);
  }, []);

  const typedDispatch = useCallback(
    (action: WizardAction) => dispatch(action),
    []
  );

  const isLastStep = state.activeStep === WIZARD_STEPS.length - 1;

  // Check if all steps are valid for the Create button
  const allValid = WIZARD_STEPS.every(
    (stepId) => validateStep(stepId, state).valid
  );

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Title title="New Project Wizard" />

      <Typography variant="h4" gutterBottom>
        New Project Wizard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Set up a new Roundware project step by step. You can navigate between
        steps freely — nothing is saved until you click &quot;Create Project&quot;.
      </Typography>

      {/* ---- Stepper ---- */}
      <Stepper
        activeStep={state.activeStep}
        nonLinear
        sx={{ mb: 4 }}
      >
        {WIZARD_STEPS.map((stepId, index) => {
          const stepValidation = validateStep(stepId, state);
          // Mark completed if user has been past this step and it's valid
          const completed =
            index < state.activeStep && stepValidation.valid;
          return (
            <Step key={stepId} completed={completed}>
              <StepButton onClick={() => handleStepClick(index)}>
                {STEP_LABELS[stepId]}
              </StepButton>
            </Step>
          );
        })}
      </Stepper>

      {/* ---- Step Content ---- */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <StepContent
            stepId={currentStepId}
            state={state}
            dispatch={typedDispatch}
          />
        </CardContent>
      </Card>

      {/* ---- Validation Errors ---- */}
      {!validation.valid && state.activeStep > 0 && (
        <Box sx={{ mb: 2 }}>
          {validation.errors.map((err, i) => (
            <Typography key={i} color="error" variant="body2">
              {err}
            </Typography>
          ))}
        </Box>
      )}

      {/* ---- Navigation Buttons ---- */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={state.activeStep === 0}
        >
          Back
        </Button>

        <Box sx={{ display: "flex", gap: 2 }}>
          {isLastStep ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<RocketLaunchIcon />}
              onClick={handleCreate}
              disabled={!allValid}
            >
              Create Project
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* ---- Creation Dialog ---- */}
      {showCreation && (
        <CreationProgress
          state={state}
          open={showCreation}
          onClose={handleCreationClose}
          onDone={handleCreationDone}
        />
      )}

      {/* ---- Navigation warning dialog (React Router) ---- */}
      <Dialog open={showNavPrompt} onClose={cancelNavigation}>
        <DialogTitle>Leave wizard?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved wizard progress. If you leave now, all your
            configuration will be lost. Are you sure you want to leave?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelNavigation} autoFocus>
            Stay
          </Button>
          <Button onClick={confirmNavigation} color="error">
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectWizardPage;

// ---- Step router ----------------------------------------------------------

interface StepContentProps {
  stepId: WizardStepId;
  state: typeof INITIAL_STATE;
  dispatch: (action: WizardAction) => void;
}

const StepContent: React.FC<StepContentProps> = ({ stepId, state, dispatch }) => {
  switch (stepId) {
    case "template":
      return <TemplateStep state={state} dispatch={dispatch} />;
    case "project":
      return <ProjectStep state={state} dispatch={dispatch} />;
    case "audiotrack":
      return <AudiotrackStep state={state} dispatch={dispatch} />;
    case "tags":
      return <ContentTagsStep state={state} dispatch={dispatch} />;
    case "uibuilder":
      return <UIBuilderStep state={state} dispatch={dispatch} />;
    case "speakers":
      return <SpeakersStep state={state} dispatch={dispatch} />;
    default:
      return null;
  }
};
