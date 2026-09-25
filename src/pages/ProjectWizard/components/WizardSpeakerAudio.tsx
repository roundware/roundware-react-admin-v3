import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import AudioRecorder from "components/common/AudioRecorder";
import React, { useEffect, useState } from "react";

/**
 * Pick or record a speaker's audio during project creation.
 *
 * Same two ways in as the speaker form's audio control, minus URI: the wizard
 * posts the file to `upload-audio/` after the speaker exists, and a URI needs
 * no upload step, so offering it here would be a third code path for something
 * better done on the speaker form afterwards.
 *
 * The recording arrives as a WebM `Blob` from `AudioRecorder`; the server runs
 * every upload through FFmpeg and stores MP3 + M4A, so the container it was
 * captured in does not matter.
 *
 * Preview is a bare `<audio>` element rather than `SpeakerAudioPlayer`. That
 * component reads `min_volume`, `start_time` and friends through
 * `useFieldValue`, which is `useFormContext()` — null outside a react-admin
 * form. Rendering it here threw "Cannot read properties of null (reading
 * 'watch')" the instant a file was chosen, taking the whole wizard down with
 * it. Its extra controls edit fields the wizard does not have anyway.
 */

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
}

const WizardSpeakerAudio: React.FC<Props> = ({ value, onChange }) => {
  const [mode, setMode] = useState<"UPLOAD" | "RECORD">("UPLOAD");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // Object URLs leak until revoked, and the wizard can hold several speakers
  // at once with audio being swapped on each.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Tabs
        value={mode}
        onChange={(_e, v) => setMode(v)}
        sx={{ minHeight: 36, mb: 1 }}
      >
        <Tab label="UPLOAD" value="UPLOAD" sx={{ minHeight: 36 }} />
        <Tab label="RECORD" value="RECORD" sx={{ minHeight: 36 }} />
      </Tabs>

      {mode === "UPLOAD" && (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            component="label"
            variant={value ? "outlined" : "contained"}
            size="small"
            startIcon={<AudiotrackIcon />}
          >
            {value ? "Replace audio" : "Choose file"}
            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
          </Button>
        </Stack>
      )}

      {mode === "RECORD" &&
        (value ? (
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => onChange(null)}
          >
            Delete recording
          </Button>
        ) : (
          <AudioRecorder
            onFinish={(blob) =>
              onChange(
                new File([blob], `speaker-recording-${Date.now()}.webm`, {
                  type: blob.type || "audio/webm",
                })
              )
            }
          />
        ))}

      {value ? (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{value.name}</Typography>
            <Button size="small" onClick={() => onChange(null)}>
              Remove
            </Button>
          </Stack>
          {previewUrl && (
            <audio src={previewUrl} controls style={{ width: "100%" }} />
          )}
        </Stack>
      ) : (
        // Deliberately a warning, not a blocker: a speaker with no audio is
        // silent and pointless, but it is a reasonable work-in-progress if the
        // audio is not ready.
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          No audio yet — this speaker will be silent. You can add it later from
          the Speakers page.
        </Typography>
      )}
    </Box>
  );
};

export default WizardSpeakerAudio;
