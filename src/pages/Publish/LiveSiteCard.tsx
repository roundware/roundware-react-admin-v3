import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import { Confirm } from "react-admin";
import {
  LiveSiteState,
  clearTestContributions,
  errMessage,
  getLiveSite,
  updateLiveSite,
} from "./api";
import { versionLabel, when } from "./VersionsCard";

interface Props {
  projectId: number;
  /** Bumped when the project is published, moved or unpublished, or a
   *  version is made live. */
  refreshKey: number;
  /** Whether the project is published, once known. */
  onPublished?: (published: boolean) => void;
  /** Called after the live site is updated (a new version is saved). */
  onUpdated?: () => void;
}

/**
 * A published project's live site: whether the test site has changes the
 * live one doesn't, "Update live site", and the test site's contributions
 * (server docs/021).
 */
const LiveSiteCard: React.FC<Props> = ({ projectId, refreshKey, onPublished, onUpdated }) => {
  const [state, setState] = useState<LiveSiteState | null>(null);
  const [busy, setBusy] = useState<"update" | "clear" | null>(null);
  const [confirm, setConfirm] = useState<"update" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // An optional name for the version "Update live site" saves.
  const [name, setName] = useState("");

  const load = useCallback(() => {
    setError(null);
    getLiveSite(projectId)
      .then((s) => {
        setState(s);
        onPublished?.(s.published);
      })
      .catch((e) => setError(errMessage(e)));
  }, [projectId, onPublished]);

  useEffect(() => {
    setState(null);
    load();
  }, [load, refreshKey]);

  if (!state && !error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <CircularProgress size={20} />
        </CardContent>
      </Card>
    );
  }
  if (state && !state.published) return null;

  const handleUpdate = async () => {
    setConfirm(null);
    setBusy("update");
    setError(null);
    setNotice(null);
    try {
      setState(await updateLiveSite(projectId, name));
      setName("");
      setNotice("The live site now shows the project as the test site does.");
      onUpdated?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const handleClear = async () => {
    setConfirm(null);
    setBusy("clear");
    setError(null);
    setNotice(null);
    try {
      const n = await clearTestContributions(projectId);
      setNotice(`Deleted ${n} test contribution${n === 1 ? "" : "s"}.`);
      load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const tests = state?.test_contributions ?? 0;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SyncIcon color="primary" />
          <Typography variant="h6">Live site</Typography>
          {state?.has_changes === true && (
            <Chip label="Changes not yet live" color="warning" size="small" />
          )}
          {state?.has_changes === false && (
            <Chip label="Up to date" color="success" size="small" />
          )}
        </Stack>

        <Typography variant="body2" sx={{ mb: 1 }}>
          Participants see the live site. Changes you save show on the test
          site right away, and reach the live site when you update it.
        </Typography>
        {state?.updated_at && (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 2 }}>
            Showing{" "}
            <strong>
              {versionLabel({
                name: state.live_version_name,
                created_at: state.live_version_created_at,
              })}
            </strong>
            , made live {when(state.updated_at)}
            {state.updated_by ? ` by ${state.updated_by}` : ""}.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <Button
          variant={state?.has_changes ? "contained" : "outlined"}
          disabled={busy !== null}
          onClick={() => setConfirm("update")}
          startIcon={busy === "update" ? <CircularProgress size={16} /> : undefined}
        >
          Update live site
        </Button>

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2">Test contributions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tests === 0
              ? "Nothing has been recorded on the test site."
              : `${tests} contribution${tests === 1 ? " was" : "s were"} recorded on the test site (or in the preview).`}{" "}
            They show only there and in Contributions, and send no
            notifications. Deleting them keeps their files in storage.
          </Typography>
          {tests > 0 && (
            <Button
              color="error"
              variant="outlined"
              size="small"
              disabled={busy !== null}
              onClick={() => setConfirm("clear")}
              startIcon={busy === "clear" ? <CircularProgress size={16} /> : undefined}
            >
              Delete test contributions
            </Button>
          )}
        </Box>

        <Confirm
          isOpen={confirm === "update"}
          title="Update the live site?"
          content={
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Participants will see the project as the test site shows it
                now: its settings, look, copy, menus, tags, speakers and audio
                tracks. It's saved as a version you can go back to.
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Version name (optional)"
                placeholder="Opening night"
                value={name}
                inputProps={{ maxLength: 200 }}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          }
          confirm="Update live site"
          cancel="Cancel"
          onConfirm={handleUpdate}
          onClose={() => setConfirm(null)}
        />
        <Confirm
          isOpen={confirm === "clear"}
          title={`Delete ${tests} test contribution${tests === 1 ? "" : "s"}?`}
          content="They are removed from the project for good. Their files are kept in storage."
          confirm="Delete"
          confirmColor="warning"
          cancel="Cancel"
          onConfirm={handleClear}
          onClose={() => setConfirm(null)}
        />
      </CardContent>
    </Card>
  );
};

export default LiveSiteCard;
