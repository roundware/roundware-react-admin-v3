import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { Confirm } from "react-admin";
import {
  SiteVersion,
  deleteVersion,
  errMessage,
  listVersions,
  editVersion,
  makeVersionLive,
  saveVersion,
} from "./api";

/** When something was saved, for the lists on this page. */
export const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";

/** A version's name, or what it was for one saved without a name. */
export const versionLabel = (v: { name: string | null; created_at?: string | null }) =>
  v.name || `Live site update, ${when(v.created_at ?? null)}`;

interface Props {
  projectId: number;
  /** Whether the project has a live site to make a version live on. */
  published: boolean;
  /** Bumped when versions may have changed elsewhere (Update live site). */
  refreshKey: number;
  /** Called after a version is made live, so the live-site card reloads. */
  onChange: () => void;
}

/**
 * Saved versions of what participants see (server docs/021): save the test
 * site as a named version, make any version live (going back to an earlier
 * one, say), rename, delete. Versions are only saved settings and content;
 * the media they show is never deleted.
 */
const VersionsCard: React.FC<Props> = ({ projectId, published, refreshKey, onChange }) => {
  const [versions, setVersions] = useState<SiteVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The version dialog: saving a new one, or editing one.
  const [naming, setNaming] = useState<{
    version?: SiteVersion;
    name: string;
    freeze: boolean;
  } | null>(null);
  const [confirm, setConfirm] = useState<{ action: "live" | "delete"; version: SiteVersion } | null>(
    null
  );

  const load = useCallback(() => {
    listVersions(projectId)
      .then(setVersions)
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

  useEffect(load, [load, refreshKey]);

  const run = async (work: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      load();
      after?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleName = () => {
    if (!naming) return;
    const { version, name, freeze } = naming;
    setNaming(null);
    run(
      () =>
        version
          ? editVersion(projectId, version.id, { name, freeze_contributions: freeze })
          : saveVersion(projectId, name, freeze),
      // A live version's change shows on the live site.
      version?.is_live ? onChange : undefined
    );
  };

  const handleConfirm = () => {
    if (!confirm) return;
    const { action, version } = confirm;
    setConfirm(null);
    if (action === "live") run(() => makeVersionLive(projectId, version.id), onChange);
    else run(() => deleteVersion(projectId, version.id));
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Versions
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() => setNaming({ name: "", freeze: false })}
          >
            Save version
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A version keeps the project as the test site shows it now: settings,
          look, copy, menus, tags, speakers and audio tracks. Make one live to
          go back to it; the project you edit stays as it is. Contributions
          aren't part of a version.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {versions === null ? (
          <CircularProgress size={20} />
        ) : versions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No versions yet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {versions.map((v) => (
              <ListItem
                key={v.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {published && !v.is_live && (
                      <Button
                        size="small"
                        disabled={busy}
                        onClick={() => setConfirm({ action: "live", version: v })}
                      >
                        Make live
                      </Button>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        disabled={busy}
                        onClick={() =>
                          setNaming({ version: v, name: v.name, freeze: v.freeze_contributions })
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={v.is_live ? "The live version can't be deleted" : "Delete"}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={busy || v.is_live}
                          onClick={() => setConfirm({ action: "delete", version: v })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {versionLabel(v)}
                      {v.is_live && <Chip label="Live" color="success" size="small" />}
                      {v.freeze_contributions && (
                        <Chip label="Contributions frozen" size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={`Saved ${when(v.created_at)}${v.created_by ? ` by ${v.created_by}` : ""}`}
                  sx={{ pr: 22 }}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Dialog open={naming !== null} onClose={() => setNaming(null)} fullWidth maxWidth="xs">
          <DialogTitle>{naming?.version ? "Edit version" : "Save version"}</DialogTitle>
          <DialogContent>
            {!naming?.version && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Saves the project as the test site shows it now. The live site
                doesn't change.
              </Typography>
            )}
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Name"
              placeholder="Opening night"
              value={naming?.name ?? ""}
              inputProps={{ maxLength: 200 }}
              onChange={(e) => setNaming((n) => (n ? { ...n, name: e.target.value } : n))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && naming?.name.trim()) handleName();
              }}
            />
            <FormControlLabel
              sx={{ mt: 2, alignItems: "flex-start" }}
              control={
                <Checkbox
                  sx={{ pt: 0.5 }}
                  checked={naming?.freeze ?? false}
                  onChange={(e) => setNaming((n) => (n ? { ...n, freeze: e.target.checked } : n))}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Show only contributions made before this version
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    For an archive: while it's live, the site shows the project as it
                    was, recordings included. New recordings are kept but don't show.
                  </Typography>
                </Box>
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNaming(null)}>Cancel</Button>
            <Button variant="contained" disabled={!naming?.name.trim()} onClick={handleName}>
              {naming?.version ? "Save" : "Save version"}
            </Button>
          </DialogActions>
        </Dialog>

        <Confirm
          isOpen={confirm?.action === "live"}
          title={`Make “${confirm ? versionLabel(confirm.version) : ""}” live?`}
          content="Participants will see the project as it was in this version. The project you edit, and the test site, stay as they are."
          confirm="Make live"
          cancel="Cancel"
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
        />
        <Confirm
          isOpen={confirm?.action === "delete"}
          title={`Delete “${confirm ? versionLabel(confirm.version) : ""}”?`}
          content="The saved version goes; the project, its contributions and all media files are kept."
          confirm="Delete"
          confirmColor="warning"
          cancel="Cancel"
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
        />
      </CardContent>
    </Card>
  );
};

export default VersionsCard;
