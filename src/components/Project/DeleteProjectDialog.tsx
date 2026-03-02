// ---------------------------------------------------------------------------
// Delete project confirmation dialog with cascade warning
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";

interface ProjectToDelete {
  id: number;
  name: string;
}

interface DeleteProjectDialogProps {
  open: boolean;
  projects: ProjectToDelete[];
  onClose: () => void;
  onDeleted: () => void;
}

interface DeleteStatus {
  projectId: number;
  status: "pending" | "deleting" | "deleted" | "error";
  error?: string;
}

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  open,
  projects,
  onClose,
  onDeleted,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [keepFiles, setKeepFiles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statuses, setStatuses] = useState<DeleteStatus[]>([]);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    if (deleting) return; // Prevent closing while deleting
    setConfirmed(false);
    setKeepFiles(false);
    setDeleting(false);
    setStatuses([]);
    setDone(false);
    if (done) {
      onDeleted();
    }
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const initial: DeleteStatus[] = projects.map((p) => ({
      projectId: p.id,
      status: "pending",
    }));
    setStatuses(initial);

    let hasErrors = false;
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      setStatuses((prev) =>
        prev.map((s) =>
          s.projectId === project.id ? { ...s, status: "deleting" } : s
        )
      );

      try {
        const deleteFilesParam = keepFiles ? "false" : "true";
        await apiFetcher(`/projects/${project.id}/?delete_files=${deleteFilesParam}`, {
          method: "DELETE",
        });
        setStatuses((prev) =>
          prev.map((s) =>
            s.projectId === project.id ? { ...s, status: "deleted" } : s
          )
        );
      } catch (e) {
        hasErrors = true;
        setStatuses((prev) =>
          prev.map((s) =>
            s.projectId === project.id
              ? { ...s, status: "error", error: String(e) }
              : s
          )
        );
      }
    }

    setDeleting(false);
    if (!hasErrors) {
      setDone(true);
    }
  };

  const isSingle = projects.length === 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="error" />
        {done
          ? "Deletion Complete"
          : `Delete ${isSingle ? "Project" : `${projects.length} Projects`}?`}
      </DialogTitle>
      <DialogContent>
        {!deleting && statuses.length === 0 && (
          <>
            <Typography variant="body1" gutterBottom>
              {isSingle
                ? `This will permanently delete project "${projects[0].name}" (ID: ${projects[0].id}).`
                : `This will permanently delete the following ${projects.length} projects:`}
            </Typography>

            {!isSingle && (
              <List dense sx={{ mb: 1 }}>
                {projects.map((p) => (
                  <ListItem key={p.id} sx={{ py: 0 }}>
                    <ListItemText
                      primary={`${p.name} (ID: ${p.id})`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box
              sx={{
                bgcolor: "error.light",
                color: "error.contrastText",
                p: 2,
                borderRadius: 1,
                mt: 1,
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                All associated data will be permanently deleted:
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Tags (tag categories are shared across projects and will not be deleted)</li>
                  <li>Assets (audio recordings, photos, text)</li>
                  <li>Speakers and speaker shapes</li>
                  <li>Audiotracks</li>
                  <li>UI groups and UI items</li>
                  <li>Sessions, events, and envelopes</li>
                  <li>Timed assets and notifications</li>
                  <li>Project localizations and branding</li>
                </ul>
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={keepFiles}
                  onChange={(e) => setKeepFiles(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Keep media files (audio, images) in storage for potential
                  reuse in other projects
                </Typography>
              }
              sx={{ mt: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  color="error"
                />
              }
              label={
                <Typography variant="body2">
                  I understand this action is irreversible and all database
                  records will be permanently deleted.
                </Typography>
              }
              sx={{ mt: 1 }}
            />
          </>
        )}

        {(deleting || statuses.length > 0) && (
          <List dense>
            {projects.map((p) => {
              const s = statuses.find((s) => s.projectId === p.id);
              return (
                <ListItem key={p.id}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {s?.status === "deleted" && (
                      <CheckCircleIcon color="success" />
                    )}
                    {s?.status === "deleting" && (
                      <CircularProgress size={20} />
                    )}
                    {s?.status === "error" && <ErrorIcon color="error" />}
                    {(!s || s.status === "pending") && (
                      <CircularProgress size={20} variant="determinate" value={0} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${p.name} (ID: ${p.id})`}
                    secondary={s?.error || undefined}
                    secondaryTypographyProps={{ color: "error" }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {done && (
          <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
            {isSingle
              ? "Project has been deleted successfully."
              : "All projects have been deleted successfully."}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {!deleting && statuses.length === 0 && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              disabled={!confirmed}
            >
              Delete {isSingle ? "Project" : `${projects.length} Projects`}
            </Button>
          </>
        )}
        {done && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
        {deleting && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            Deleting...
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProjectDialog;
