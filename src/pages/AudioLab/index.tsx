// ---------------------------------------------------------------------------
// Audio lab — a project's audio settings, heard as they are changed
// (roundware-server-v3 docs/016-audio.md).
//
// Speaker effects and looping are heard through the web app itself: its /lab
// page is embedded here and plays the chosen speaker through the framework's
// SpeakerPreview, following each change live. The admin runs a different copy
// of the audio code, so playing it here would not be what listeners hear.
//
// Speaker, looping and recording settings are saved into the project's
// ui_config_json (listen.speaker, speak.audioProcessingMinimization); upload
// processing through /projects/{id}/upload-audio/. Only values that differ
// from the defaults are saved, so setting something back to its default
// removes it, and later changes to the defaults reach it.
// ---------------------------------------------------------------------------
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { isEqual } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Title, useNotify } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage, mintPreviewToken, webappUrl } from "../Publish/api";
import { fractionText, parseFractions, parsePans } from "./lists";

type Obj = Record<string, any>;

// --- What the lab edits -----------------------------------------------------

interface SliderDef {
  key: string;
  label: string;
  help?: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** Depends on several speakers or a listener's position: not in the lab. */
  appOnly?: boolean;
}

const EFFECTS: SliderDef[] = [
  { key: "delayTimeInMs", label: "Echo delay", min: 0, max: 1000, step: 10, unit: "ms", help: "0 turns the echo off." },
  { key: "feedback", label: "Echo repeats", min: 0, max: 0.95, step: 0.05, help: "How much of each echo feeds the next." },
  { key: "wetDryRatio", label: "Effects mix", min: 0, max: 1, step: 0.05, help: "0 is the dry recording only, with no reverb; 1 is effects only." },
  { key: "reverbRoomSize", label: "Reverb room size", min: 0, max: 1, step: 0.05 },
  { key: "reverbDamping", label: "Reverb damping", min: 0, max: 1, step: 0.05, help: "Higher is a darker, shorter tail." },
];

const effect = (key: string) => EFFECTS.find((e) => e.key === key)!;
// Laid out as two columns, echo beside reverb; the mix sets the level of
// both, so it sits full width beneath them.
const ECHO = [effect("delayTimeInMs"), effect("feedback")];
const REVERB = [effect("reverbRoomSize"), effect("reverbDamping")];
const MIX = effect("wetDryRatio");

const LOOPING: SliderDef[] = [
  { key: "loopPointUpdateProbability", label: "New loop length", min: 0, max: 1, step: 0.05, help: "Chance of picking a new loop length at each loop point." },
  { key: "speakerRotationProbability", label: "Swap voices", min: 0, max: 1, step: 0.05, appOnly: true, help: "Chance a playing voice is swapped for another in range at a loop point." },
  { key: "slotConsiderationProbability", label: "Fill free slots", min: 0, max: 1, step: 0.05, appOnly: true, help: "Chance an empty voice slot is filled at a loop point." },
  { key: "replaceWithNoneProbability", label: "Silence a slot", min: 0, max: 1, step: 0.05, appOnly: true, help: "Chance a slot falls silent instead." },
  { key: "minVariantLoops", label: "Variant: fewest loops", min: 1, max: 20, step: 1, appOnly: true },
  { key: "maxVariantLoops", label: "Variant: most loops", min: 1, max: 20, step: 1, appOnly: true },
  { key: "variantCrossfadeDurationMs", label: "Variant crossfade", min: 0, max: 5000, step: 100, unit: "ms", appOnly: true },
  { key: "newSpeakerFadeInDurationMs", label: "New voice fade-in", min: 0, max: 10000, step: 100, unit: "ms", appOnly: true },
];

const LOOP_KEYS = ["loopFractions", ...LOOPING.map((d) => d.key)];
const RECORDING_KEYS = ["echoCancellation", "noiseSuppression", "autoGainControl", "channelCount", "sampleRate"];

/** Only what differs from `defaults`, for the keys given; nested one level for effects. */
function overrides(draft: Obj, defaults: Obj, keys: string[]): Obj {
  const out: Obj = {};
  for (const k of keys) if (draft[k] !== undefined && !isEqual(draft[k], defaults?.[k])) out[k] = draft[k];
  return out;
}

/** Write `changes` for `keys` into `section`: set what is given, remove the rest. */
function applyTo(section: Obj | undefined, keys: string[], changes: Obj): Obj {
  const next = { ...(section ?? {}) };
  for (const k of keys) {
    if (k in changes) next[k] = changes[k];
    else delete next[k];
  }
  return next;
}

// --- Page -------------------------------------------------------------------

interface SpeakerOption {
  id: number;
  name: string;
  uri: string;
  volume: number;
}

const AudioLabPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const isLooping = selectedProject?.recording_method === "looping";
  const notify = useNotify();

  const [labSrc, setLabSrc] = useState<string | null>(null);
  const [labReady, setLabReady] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const iframe = useRef<HTMLIFrameElement | null>(null);
  const labOrigin = useMemo(() => new URL(webappUrl()).origin, []);

  const [speakers, setSpeakers] = useState<SpeakerOption[]>([]);
  const [speakerId, setSpeakerId] = useState<number | "">("");

  // Speaker settings: in effect (as saved), defaults, and the working copy.
  const [speakerDefaults, setSpeakerDefaults] = useState<Obj>({});
  const [speakerSaved, setSpeakerSaved] = useState<Obj | null>(null);
  const [speakerDraft, setSpeakerDraft] = useState<Obj | null>(null);
  const [recordingDefaults, setRecordingDefaults] = useState<Obj>({});
  const [recordingSaved, setRecordingSaved] = useState<Obj | null>(null);
  const [recordingDraft, setRecordingDraft] = useState<Obj | null>(null);

  const [fractionsText, setFractionsText] = useState("");
  const [pansText, setPansText] = useState("");
  const [saving, setSaving] = useState(false);

  // --- The embedded lab ---------------------------------------------------
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    mintPreviewToken(projectId)
      .then((token) => {
        if (!cancelled)
          setLabSrc(`${webappUrl()}/lab?preview=1&project_id=${projectId}&token=${encodeURIComponent(token)}`);
      })
      .catch((e) => !cancelled && setLabError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const toLab = (message: Obj) =>
    iframe.current?.contentWindow?.postMessage({ source: "rw-admin", ...message }, labOrigin);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== labOrigin || event.data?.source !== "rw-lab") return;
      if (event.data.type === "ready") {
        const pick = (o: Obj | undefined, keys: string[]) =>
          Object.fromEntries(keys.map((k) => [k, o?.[k]]));
        const speakerKeys = ["effects", ...LOOP_KEYS];
        const saved = pick(event.data.speaker, speakerKeys);
        setSpeakerDefaults(pick(event.data.speakerDefaults, speakerKeys));
        setSpeakerSaved(saved);
        setSpeakerDraft(saved);
        setFractionsText((saved.loopFractions ?? [1]).map(fractionText).join(", "));
        setPansText((saved.effects?.pan ?? []).join(", "));
        const rec = pick(event.data.recording, RECORDING_KEYS);
        setRecordingDefaults(pick(event.data.recordingDefaults, RECORDING_KEYS));
        setRecordingSaved(rec);
        setRecordingDraft(rec);
        setLabReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [labOrigin]);

  // Speakers with audio to play.
  useEffect(() => {
    if (!projectId) return;
    apiFetcher(`/speakers/?project_id=${projectId}`)
      .then(({ json }) => {
        const rows = (Array.isArray(json) ? json : json?.results ?? []) as Obj[];
        setSpeakers(
          rows
            .filter((s) => s.uri)
            .map((s) => ({ id: s.id, name: s.code || `Speaker ${s.id}`, uri: s.uri, volume: s.max_volume ?? 1 }))
        );
      })
      .catch(() => setSpeakers([]));
  }, [projectId]);

  useEffect(() => {
    if (!labReady) return;
    const s = speakers.find((x) => x.id === speakerId);
    toLab({ type: "speaker", speaker: s ?? null });
  }, [labReady, speakerId, speakers]);

  // Every edit is heard at once.
  useEffect(() => {
    if (labReady && speakerDraft) toLab({ type: "config", speaker: speakerDraft });
  }, [labReady, speakerDraft]);

  // --- Editing ------------------------------------------------------------
  const setEffect = (key: string, value: unknown) =>
    setSpeakerDraft((d) => ({ ...d, effects: { ...(d?.effects ?? {}), [key]: value } }));
  const setSpeakerKey = (key: string, value: unknown) =>
    setSpeakerDraft((d) => ({ ...d, [key]: value }));
  const setRecordingKey = (key: string, value: unknown) =>
    setRecordingDraft((d) => ({ ...d, [key]: value }));

  const fractions = parseFractions(fractionsText);
  const pans = parsePans(pansText);
  useEffect(() => {
    if ("values" in fractions && !isEqual(fractions.values, speakerDraft?.loopFractions))
      setSpeakerKey("loopFractions", fractions.values);
  }, [fractionsText]);
  useEffect(() => {
    if ("values" in pans && !isEqual(pans.values, speakerDraft?.effects?.pan)) setEffect("pan", pans.values);
  }, [pansText]);

  const speakerDirty = !isEqual(speakerDraft, speakerSaved);
  const recordingDirty = !isEqual(recordingDraft, recordingSaved);

  const resetSpeaker = () => {
    const d = { ...speakerDefaults };
    setSpeakerDraft(d);
    setFractionsText((d.loopFractions ?? [1]).map(fractionText).join(", "));
    setPansText((d.effects?.pan ?? []).join(", "));
  };

  const save = async () => {
    if (!projectId || !speakerDraft || !recordingDraft) return;
    setSaving(true);
    try {
      // Merge into the current document, so edits made meanwhile elsewhere
      // (Advanced configuration, Map appearance) are kept.
      const { json: project } = await apiFetcher(`/projects/${projectId}/`);
      const doc: Obj = { ...(project?.ui_config_json ?? {}) };

      const effectKeys = [...EFFECTS.map((e) => e.key), "pan"];
      const effectChanges = overrides(speakerDraft.effects ?? {}, speakerDefaults.effects ?? {}, effectKeys);
      const speakerChanges = overrides(speakerDraft, speakerDefaults, LOOP_KEYS);
      if (Object.keys(effectChanges).length) speakerChanges.effects = effectChanges;
      const speakerSection = applyTo(doc.listen?.speaker, ["effects", ...LOOP_KEYS], speakerChanges);
      const listen = { ...(doc.listen ?? {}), speaker: speakerSection };
      if (!Object.keys(speakerSection).length) delete listen.speaker;
      if (Object.keys(listen).length) doc.listen = listen;
      else delete doc.listen;

      const recordingChanges = overrides(recordingDraft, recordingDefaults, RECORDING_KEYS);
      const apm = applyTo(doc.speak?.audioProcessingMinimization, RECORDING_KEYS, recordingChanges);
      const speak = { ...(doc.speak ?? {}), audioProcessingMinimization: apm };
      if (!Object.keys(apm).length) delete speak.audioProcessingMinimization;
      if (Object.keys(speak).length) doc.speak = speak;
      else delete doc.speak;

      await apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ ui_config_json: doc }),
      });
      setSpeakerSaved(speakerDraft);
      setRecordingSaved(recordingDraft);
      notify("Audio settings saved.", { type: "success" });
    } catch (e) {
      notify(errMessage(e), { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedProject) {
    return (
      <Container sx={{ py: 4 }}>
        <Title title="Audio Lab" />
        <Typography color="text.secondary">Select a project first.</Typography>
      </Container>
    );
  }

  const slider = (def: SliderDef, value: number | undefined, onChange: (v: number) => void) => (
    <Box key={def.key}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">
          {def.label}
          {def.appOnly && (
            <Typography component="span" variant="caption" color="text.secondary">
              {" "}
              · heard in the app, not in the lab
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value ?? "—"}
          {def.unit ? ` ${def.unit}` : ""}
        </Typography>
      </Stack>
      <Slider
        size="small"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value ?? def.min}
        onChange={(_e, v) => onChange(v as number)}
      />
      {def.help && (
        <Typography variant="caption" color="text.secondary">
          {def.help}
        </Typography>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Title title="Audio Lab" />
      <Typography variant="h4" gutterBottom>
        Audio Lab
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        How this project sounds and records. Pick a speaker and press play to hear effects changes
        as you make them. Which contributions play, when, and how they fade in and out is set
        under{" "}
        <Link component={RouterLink} to={`/project/${selectedProject.id}/audiotracks`}>
          Playback
        </Link>
        .
      </Typography>

      {labError && <Alert severity="error" sx={{ mb: 2 }}>{labError}</Alert>}

      <Stack spacing={3}>
        {/* Player: one short row, kept in view while the settings below scroll
            (the app bar hides on scroll, so it pins to the very top). */}
        <Card sx={{ position: "sticky", top: 0, zIndex: 2 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField
                select
                size="small"
                label="Speaker to hear"
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value === "" ? "" : Number(e.target.value))}
                helperText={speakers.length ? undefined : "This project has no speakers with audio yet."}
                disabled={!speakers.length}
                sx={{ minWidth: 240 }}
              >
                {speakers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              {labSrc && (
                <Box
                  component="iframe"
                  ref={iframe}
                  src={labSrc}
                  title="Audio Lab player"
                  // The lab page is transparent; the card shows through.
                  sx={{ flex: 1, minWidth: 0, height: 56, border: 0 }}
                />
              )}
            </Stack>
            {!labReady && !labError && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading the project's audio settings from the web app…
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>

        {labReady && speakerDraft && recordingDraft && (
          <>
              <Card>
                <CardHeader title="Speaker effects" subheader="Echo and reverb on every speaker, and where each voice sits left to right." />
                <CardContent>
                  <Grid container columnSpacing={4} rowSpacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="overline" color="text.secondary">Echo</Typography>
                      <Stack spacing={2.5}>
                        {ECHO.map((def) => slider(def, speakerDraft.effects?.[def.key], (v) => setEffect(def.key, v)))}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="overline" color="text.secondary">Reverb</Typography>
                      <Stack spacing={2.5}>
                        {REVERB.map((def) => slider(def, speakerDraft.effects?.[def.key], (v) => setEffect(def.key, v)))}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      {slider(MIX, speakerDraft.effects?.[MIX.key], (v) => setEffect(MIX.key, v))}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Pan positions"
                        value={pansText}
                        onChange={(e) => setPansText(e.target.value)}
                        error={"error" in pans}
                        helperText={
                          "error" in pans
                            ? pans.error
                            : "One per voice slot, from −1 (left) to 1 (right), e.g. -0.8, -0.4, 0.4, 0.8. The lab plays slot 1."
                        }
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {isLooping && (
                <Card>
                  <CardHeader title="Looping" subheader="How voices loop and change. Only for looping projects." />
                  <CardContent>
                    <Stack spacing={2.5}>
                      <TextField
                        size="small"
                        label="Loop lengths"
                        value={fractionsText}
                        onChange={(e) => setFractionsText(e.target.value)}
                        error={"error" in fractions}
                        helperText={
                          "error" in fractions
                            ? fractions.error
                            : "Fractions of each recording to loop, picked at random; negative plays it backwards. e.g. 1/2, 1, 1, -1/4. Repeat one to make it likelier."
                        }
                      />
                      {LOOPING.map((def) =>
                        slider(def, speakerDraft[def.key], (v) => setSpeakerKey(def.key, v))
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader
                  title="Recording input"
                  subheader="What the browser does to a participant's microphone before recording. All off keeps recordings untouched."
                />
                <CardContent>
                  <Stack spacing={1}>
                    {[
                      ["echoCancellation", "Echo cancellation", "Removes sound from the device's own speaker — useful when the app is playing while recording."],
                      ["noiseSuppression", "Noise suppression", "Reduces steady background noise, e.g. at a busy event. Can dull voices."],
                      ["autoGainControl", "Automatic level", "Evens out loud and quiet speakers. Can pump on music or ambient sound."],
                    ].map(([key, label, help]) => (
                      <Box key={key}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!recordingDraft[key]}
                              onChange={(_e, c) => setRecordingKey(key, c)}
                            />
                          }
                          label={label}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6, mt: -1 }}>
                          {help}
                        </Typography>
                      </Box>
                    ))}
                    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                      <TextField
                        select
                        size="small"
                        label="Channels"
                        value={recordingDraft.channelCount ?? 1}
                        onChange={(e) => setRecordingKey("channelCount", Number(e.target.value))}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value={1}>Mono</MenuItem>
                        <MenuItem value={2}>Stereo</MenuItem>
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Sample rate"
                        value={recordingDraft.sampleRate ?? 48000}
                        onChange={(e) => setRecordingKey("sampleRate", Number(e.target.value))}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value={44100}>44.1 kHz</MenuItem>
                        <MenuItem value={48000}>48 kHz</MenuItem>
                      </TextField>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  onClick={save}
                  disabled={saving || (!speakerDirty && !recordingDirty) || "error" in fractions || "error" in pans}
                >
                  Save speaker and recording settings
                </Button>
                <Button onClick={resetSpeaker} disabled={saving}>
                  Speaker settings to defaults
                </Button>
                {saving && <CircularProgress size={18} />}
              </Stack>

              <UploadProcessingCard projectId={selectedProject.id} />
          </>
        )}
      </Stack>
    </Container>
  );
};

// --- Upload processing (server-side, per project) ---------------------------

interface UploadField {
  key: string;
  kind: "bool" | "number";
  label: string;
  description: string;
  min: number | null;
  max: number | null;
  step: number | null;
  unit: string;
}

const UploadProcessingCard: React.FC<{ projectId: number }> = ({ projectId }) => {
  const notify = useNotify();
  const [fields, setFields] = useState<UploadField[]>([]);
  const [defaults, setDefaults] = useState<Obj>({});
  const [saved, setSaved] = useState<Obj | null>(null);
  const [draft, setDraft] = useState<Obj | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetcher(`/projects/${projectId}/upload-audio/`)
      .then(({ json }) => {
        setFields(json.fields);
        setDefaults(json.defaults);
        setSaved(json.effective);
        setDraft(json.effective);
      })
      .catch((e) => notify(errMessage(e), { type: "error" }));
  }, [projectId]);

  if (!draft) return null;

  const save = async () => {
    setSaving(true);
    try {
      // Only what differs from the server's defaults.
      const body = overrides(draft, defaults, fields.map((f) => f.key));
      const { json } = await apiFetcher(`/projects/${projectId}/upload-audio/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSaved(json.effective);
      setDraft(json.effective);
      notify("Upload processing saved. It applies to uploads from now on.", { type: "success" });
    } catch (e) {
      notify(errMessage(e), { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const compressionOff = !draft.compression;
  return (
    <Card>
      <CardHeader
        title="Upload processing"
        subheader="Done on the server to every recording as it is uploaded, speakers included. Applies to new uploads; nothing already uploaded changes, so there is nothing to play here."
      />
      <CardContent>
        <Stack spacing={2}>
          {fields.map((f) =>
            f.kind === "bool" ? (
              <Box key={f.key}>
                <FormControlLabel
                  control={<Switch checked={!!draft[f.key]} onChange={(_e, c) => setDraft({ ...draft, [f.key]: c })} />}
                  label={f.label}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6, mt: -1 }}>
                  {f.description}
                </Typography>
              </Box>
            ) : (
              <Box key={f.key} sx={{ opacity: ["ratio", "threshold_db", "attack_ms", "release_ms", "makeup_db"].includes(f.key) && compressionOff ? 0.5 : 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">{f.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {draft[f.key]} {f.unit}
                  </Typography>
                </Stack>
                <Slider
                  size="small"
                  min={f.min ?? 0}
                  max={f.max ?? 1}
                  step={f.step ?? 1}
                  value={draft[f.key]}
                  onChange={(_e, v) => setDraft({ ...draft, [f.key]: v as number })}
                />
                <Typography variant="caption" color="text.secondary">
                  {f.description}
                </Typography>
              </Box>
            )
          )}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={save} disabled={saving || isEqual(draft, saved)}>
              Save upload processing
            </Button>
            <Button onClick={() => setDraft({ ...defaults })} disabled={saving || isEqual(draft, defaults)}>
              Server defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AudioLabPage;
