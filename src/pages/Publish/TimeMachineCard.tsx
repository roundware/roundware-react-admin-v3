import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UpdateIcon from "@mui/icons-material/Update";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./api";
import PreviewPanel from "./PreviewPanel";

interface Props {
  projectId: number;
  /** The live site's address, once published: the public page is there. */
  liveUrl: string | null;
}

interface TimeMachineSettings {
  time_machine_enabled: boolean;
  time_machine_start: string | null;
}

/** An ISO date as a datetime-local input's value, in local time. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * The time machine (server docs/022): the project growing on its map over
 * time, speaker by speaker and contribution by contribution, on its own page
 * (/timemachine). Open it here, turn the public page on, and build a link that
 * plays it, e.g. on a projector.
 */
const TimeMachineCard: React.FC<Props> = ({ projectId, liveUrl }) => {
  const [settings, setSettings] = useState<TimeMachineSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // The link's options (the web app's TimeMachine page reads them).
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [duration, setDuration] = useState(20);
  const [mode, setMode] = useState<"date" | "order">("date");

  useEffect(() => {
    apiFetcher(`/projects/${projectId}/`)
      .then(({ json }) => {
        const p = json as TimeMachineSettings;
        setSettings({
          time_machine_enabled: !!p.time_machine_enabled,
          time_machine_start: p.time_machine_start ?? null,
        });
      })
      .catch((e) => setError(errMessage(e)));
  }, [projectId]);

  const save = async (patch: Partial<TimeMachineSettings>) => {
    setError(null);
    const previous = settings;
    setSettings((s) => (s ? { ...s, ...patch } : s));
    try {
      await apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      setSettings(previous);
      setError(errMessage(e));
    }
  };

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (autoplay) q.set("autoplay", "1");
    if (loop) q.set("loop", "1");
    if (hideControls) q.set("controls", "0");
    if (duration !== 20) q.set("duration", String(duration));
    if (mode === "order") q.set("mode", "order");
    return q.toString();
  }, [autoplay, loop, hideControls, duration, mode]);

  const publicLink = liveUrl ? `${liveUrl}/timemachine${query ? `?${query}` : ""}` : null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <UpdateIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Time machine
          </Typography>
          <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
            Open time machine
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Watch the project grow on its map, speaker by speaker and
          contribution by contribution, like a time-lapse. It's a page of its
          own; nothing plays. Named versions appear as stops along it.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {settings && (
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.time_machine_enabled}
                  onChange={(e) => save({ time_machine_enabled: e.target.checked })}
                />
              }
              label="Public time machine page"
            />
            <TextField
              type="datetime-local"
              size="small"
              label="Timeline starts"
              value={toLocalInput(settings.time_machine_start)}
              onChange={(e) =>
                save({
                  time_machine_start: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              helperText="Leave empty to start at the first speaker or contribution."
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 320 }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Link options
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <FormControlLabel
                  control={<Checkbox checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />}
                  label="Play at once"
                />
                <FormControlLabel
                  control={<Checkbox checked={loop} onChange={(e) => setLoop(e.target.checked)} />}
                  label="Loop"
                />
                <FormControlLabel
                  control={
                    <Checkbox checked={hideControls} onChange={(e) => setHideControls(e.target.checked)} />
                  }
                  label="Hide controls"
                />
                <TextField
                  type="number"
                  size="small"
                  label="Seconds"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 20))}
                  inputProps={{ min: 1, max: 3600 }}
                  sx={{ width: 110 }}
                />
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={mode}
                  onChange={(_e, m) => m && setMode(m)}
                >
                  <ToggleButton value="date">By date</ToggleButton>
                  <ToggleButton value="order">One by one</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>

            {publicLink ? (
              settings.time_machine_enabled ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" fullWidth value={publicLink} InputProps={{ readOnly: true }} />
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard?.writeText(publicLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Turn on the public page to get a link to share.
                </Typography>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">
                Publish the project to get a public link.
              </Typography>
            )}
          </Stack>
        )}

        <Dialog fullScreen open={open} onClose={() => setOpen(false)}>
          <DialogTitle sx={{ display: "flex", alignItems: "center", py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>Time machine</Box>
            <IconButton onClick={() => setOpen(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {open && (
              <PreviewPanel
                projectId={projectId}
                refreshKey={0}
                title="Time machine"
                path="/timemachine"
                query={query}
                height="calc(100vh - 170px)"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TimeMachineCard;
