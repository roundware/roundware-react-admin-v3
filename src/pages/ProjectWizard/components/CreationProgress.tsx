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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { CreationStep, WizardState } from "../types";
import { executeCreation } from "../createProject";
import { useProjects } from "../../../context/ProjectsContext";
import { apiFetcher } from "../../../roundwareDataProvider/tokenAuthProvider";

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
  const pc = useProjects();

  // Refs to break the dependency cycle: we read context values from refs
  // inside the async function so they don't need to be useCallback deps.
  const pcRef = useRef(pc);
  pcRef.current = pc;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Ensure we only execute once — survives StrictMode double-mount AND
  // prevents re-execution when context objects change identity.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!open || hasStartedRef.current) return;
    hasStartedRef.current = true;

    (async () => {
      try {
        const newProjectId = await executeCreation(state, setSteps);
        setProjectId(newProjectId);
        setDone(true);
        onDoneRef.current?.();

        // Fetch the new project directly to get its full data
        let newProject = null;
        try {
          const { json: proj } = await apiFetcher(`/projects/${newProjectId}/`);
          newProject = proj;
        } catch {
          // Ignore — we'll try from the list
        }

        // Refresh project list so the new project appears in the dropdown
        await pcRef.current.refetch();

        // If the new project isn't in the list yet (cache lag), add it directly
        if (newProject) {
          const currentList = pcRef.current.projectsList ?? [];
          if (!currentList.find((p: { id: number }) => p.id === newProjectId)) {
            pcRef.current.setProjectsList([...currentList, newProject]);
          }
          pcRef.current.selectProject(newProject);
        } else {
          // Fallback: find it in the refreshed list
          const found = pcRef.current.projectsList?.find(
            (p: { id: number }) => p.id === newProjectId
          );
          if (found) pcRef.current.selectProject(found);
        }
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [open, state]);

  const handleRetry = () => {
    setDone(false);
    setError(null);
    setSteps([]);
    // The effect won't re-run since `open` hasn't changed, so call directly
    (async () => {
      hasStartedRef.current = true;
      try {
        const newProjectId = await executeCreation(state, setSteps);
        setProjectId(newProjectId);
        setDone(true);
        onDoneRef.current?.();

        let newProject = null;
        try {
          const { json: proj } = await apiFetcher(`/projects/${newProjectId}/`);
          newProject = proj;
        } catch {
          // Ignore
        }

        await pcRef.current.refetch();

        if (newProject) {
          const currentList = pcRef.current.projectsList ?? [];
          if (!currentList.find((p: { id: number }) => p.id === newProjectId)) {
            pcRef.current.setProjectsList([...currentList, newProject]);
          }
          pcRef.current.selectProject(newProject);
        } else {
          const found = pcRef.current.projectsList?.find(
            (p: { id: number }) => p.id === newProjectId
          );
          if (found) pcRef.current.selectProject(found);
        }
      } catch (e) {
        setError(String(e));
      }
    })();
  };

  // A full page load, not `navigate()`. Creating the project selects it, which
  // makes ProjectRoute re-render the whole admin under `basename="/project/:id"`;
  // a router navigation to an absolute `/project/:id/...` path then gets the
  // basename prepended again and matches nothing, dumping the user back on the
  // wizard. Reloading also guarantees the new project's data is fetched fresh
  // rather than assembled from whatever the wizard left in context.
  const goTo = (suffix: string) => () => {
    if (projectId) {
      window.location.assign(`/project/${projectId}${suffix}`);
      return;
    }
    onClose();
  };

  const handleGoToProject = goTo("");
  const handleGoToPublish = goTo("/publish");
  const handleGoToAssets = goTo("/assets");

  // Only asset-paradigm projects are pointed at the assets page. In a looping
  // project a contribution becomes a *speaker*, not an asset, so there is
  // nothing to add there — its equivalent prompt is the base-loop warning on
  // the Publish page.
  const collectsAssets = state.project.recording_method !== "looping";

  return (
    <Dialog open={open} onClose={error ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {done ? "Project Created!" : error ? "Creation Failed" : "Creating Project..."}
      </DialogTitle>
      <DialogContent>
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

        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error" variant="body2">
              An error occurred during creation. Resources created before the
              error were saved and can be managed from the admin interface.
            </Typography>
          </Box>
        )}

        {done && (
          <>
            <Typography color="success.main" variant="body2" sx={{ mt: 2 }}>
              All resources have been created successfully. You can now manage
              your project from the admin interface.
            </Typography>
            {collectsAssets && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Your project has no audio in it yet. Participants can contribute
                their own, but most projects start with something to listen to —
                <strong> Add audio</strong> takes you there.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {error && (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button onClick={handleRetry} variant="contained">
              Retry
            </Button>
          </>
        )}
        {done && (
          <>
            {collectsAssets && (
              <Button onClick={handleGoToAssets}>Add audio</Button>
            )}
            <Button onClick={handleGoToProject}>Go to Project</Button>
            <Button onClick={handleGoToPublish} variant="contained">
              Customize &amp; Publish
            </Button>
          </>
        )}
        {!done && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            Please wait...
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreationProgress;
