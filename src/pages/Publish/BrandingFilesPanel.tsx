import DeleteIcon from "@mui/icons-material/Delete";
import MicIcon from "@mui/icons-material/Mic";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AudioRecorder from "components/common/AudioRecorder";
import { useBrandingText } from "./brandingText";
import React, { useEffect, useState } from "react";
import {
  deleteBrandingFile,
  errMessage,
  FileSlot,
  getBranding,
  getBrandingSchema,
  SlotFiles,
  uploadBrandingFile,
} from "./api";

/**
 * Upload controls for every branding file a project can have.
 *
 * Rendered entirely from `GET /branding/schema/` — the admin holds no list of
 * its own. Adding a new logo, background or audio file is one entry in the
 * server's `core/branding_files.py`; this panel grows a control for it with no
 * change here, and nothing needs a migration.
 */

interface Props {
  projectId: number;
  onSaved?: () => void;
  /**
   * Just these slots, with no heading — for a file offered beside the setting
   * it belongs to (Map appearance's speaker image). Without it, the panel
   * lists every slot the server places in Images & audio (`panel: "files"`).
   */
  only?: string[];
}

const BrandingFilesPanel: React.FC<Props> = ({ projectId, onSaved, only }) => {
  const text = useBrandingText();
  const [slots, setSlots] = useState<FileSlot[] | null>(null);
  const [files, setFiles] = useState<Record<string, SlotFiles>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // Recording into an audio slot: which slot the recorder is open for, and
  // the take waiting to be kept or discarded. A take is heard before it is
  // uploaded, because an upload goes straight to the live site.
  const [recordingSlot, setRecordingSlot] = useState<string | null>(null);
  const [take, setTake] = useState<{ slot: string; file: File; url: string } | null>(null);
  useEffect(() => {
    if (!take) return;
    return () => URL.revokeObjectURL(take.url);
  }, [take]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBrandingSchema(), getBranding(projectId)])
      .then(([schema, branding]) => {
        if (cancelled) return;
        setSlots(schema);
        setFiles(branding.files || {});
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const run = async (
    slotKey: string,
    action: () => Promise<{ files: Record<string, SlotFiles> }>
  ) => {
    setBusy(slotKey);
    setError(null);
    try {
      const res = await action();
      setFiles(res.files);
      onSaved?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (error && !slots) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }
  if (!slots) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  const shown = slots.filter((s) => (only ? only.includes(s.key) : (s.panel ?? "files") === "files"));

  return (
    <Stack spacing={2.5}>
      {!only && <Typography variant="h6">Images &amp; audio</Typography>}
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      {shown.map((slot) => {
        // A slot with a file per language shows the language picked at the
        // top of Look & Feel; the default language's file is the main one.
        const lang =
          slot.localized && text?.language && text.language !== text.defaultCode
            ? text.language
            : undefined;
        const main = files[slot.key] ?? { keys: [], urls: [] };
        const stored = lang ? main.by_language?.[lang] ?? { keys: [], urls: [] } : main;
        const langName = lang && text?.languages.find((l) => l.code === lang)?.name;
        const defaultName = text?.languages.find((l) => l.code === text.defaultCode)?.name;
        const isBusy = busy === slot.key;
        return (
          <Box key={slot.key}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="subtitle2">
                {slot.label}
                {langName ? ` — ${langName}` : ""}
              </Typography>
              {isBusy && <CircularProgress size={14} />}
            </Stack>
            {lang && !stored.urls.length && (
              <Typography variant="caption" color="text.secondary" display="block">
                None yet: {langName} speakers hear the {defaultName} one
                {main.urls.length ? "" : " (if there is one)"}.
              </Typography>
            )}
            {slot.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {slot.description}
              </Typography>
            )}
            {slot.recommended && (
              <Typography variant="caption" color="text.secondary" display="block">
                Suggested: {slot.recommended}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1 }}
            >
              {stored.urls.map((url, i) => (
                <Stack
                  key={stored.keys[i]}
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                >
                  {slot.kind === "image" ? (
                    <Avatar
                      src={url}
                      variant="rounded"
                      sx={{ width: 56, height: 56 }}
                    >
                      ?
                    </Avatar>
                  ) : (
                    <audio src={url} controls style={{ height: 36 }} />
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    disabled={isBusy}
                    title={`Remove ${slot.label}`}
                    onClick={() =>
                      run(slot.key, () =>
                        // A multiple slot needs to say which file; the server
                        // refuses to guess.
                        deleteBrandingFile(
                          projectId,
                          slot.key,
                          slot.multiple ? stored.keys[i] : undefined,
                          lang
                        )
                      )
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}

              {(slot.multiple || stored.urls.length === 0) && (
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  disabled={isBusy}
                >
                  {slot.multiple && stored.urls.length > 0 ? "Add another" : "Upload"}
                  <input
                    hidden
                    type="file"
                    accept={slot.extensions.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      // Clear the input so re-picking the same file re-fires.
                      e.target.value = "";
                      if (file) {
                        run(slot.key, () =>
                          uploadBrandingFile(projectId, slot.key, file, lang)
                        );
                      }
                    }}
                  />
                </Button>
              )}

              {!slot.multiple && stored.urls.length > 0 && (
                <Button
                  component="label"
                  size="small"
                  disabled={isBusy}
                >
                  Replace
                  <input
                    hidden
                    type="file"
                    accept={slot.extensions.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) {
                        run(slot.key, () =>
                          uploadBrandingFile(projectId, slot.key, file, lang)
                        );
                      }
                    }}
                  />
                </Button>
              )}

              {/* Only where the server converts: a recording is WebM. */}
              {slot.convert_to_mp3 && !slot.multiple && (
                <Button
                  size="small"
                  variant={recordingSlot === slot.key ? "contained" : "text"}
                  startIcon={<MicIcon />}
                  disabled={isBusy}
                  onClick={() => {
                    setTake(null);
                    setRecordingSlot(recordingSlot === slot.key ? null : slot.key);
                  }}
                >
                  {recordingSlot === slot.key ? "Close recorder" : "Record"}
                </Button>
              )}
            </Stack>

            {recordingSlot === slot.key && (
              <Box sx={{ mt: 1.5, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                {take?.slot === slot.key ? (
                  <Stack spacing={1}>
                    <audio src={take.url} controls style={{ width: "100%" }} />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isBusy}
                        onClick={() => {
                          const file = take.file;
                          setTake(null);
                          setRecordingSlot(null);
                          run(slot.key, () => uploadBrandingFile(projectId, slot.key, file, lang));
                        }}
                      >
                        Use this recording
                      </Button>
                      <Button size="small" onClick={() => setTake(null)}>
                        Discard and record again
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <AudioRecorder
                    onFinish={(blob) => {
                      // Recorded as WebM; the server converts it to MP3.
                      // The name needs its extension: the server checks it.
                      const file = new File([blob], `${slot.key}.webm`, {
                        type: blob.type || "audio/webm",
                      });
                      setTake({ slot: slot.key, file, url: URL.createObjectURL(file) });
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default BrandingFilesPanel;
