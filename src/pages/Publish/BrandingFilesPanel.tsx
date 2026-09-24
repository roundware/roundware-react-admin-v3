import DeleteIcon from "@mui/icons-material/Delete";
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
}

const BrandingFilesPanel: React.FC<Props> = ({ projectId, onSaved }) => {
  const [slots, setSlots] = useState<FileSlot[] | null>(null);
  const [files, setFiles] = useState<Record<string, SlotFiles>>({});
  const [busy, setBusy] = useState<string | null>(null);
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

  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">Images &amp; audio</Typography>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      {slots.map((slot) => {
        const stored = files[slot.key] ?? { keys: [], urls: [] };
        const isBusy = busy === slot.key;
        return (
          <Box key={slot.key}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="subtitle2">{slot.label}</Typography>
              {isBusy && <CircularProgress size={14} />}
            </Stack>
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
                          slot.multiple ? stored.keys[i] : undefined
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
                          uploadBrandingFile(projectId, slot.key, file)
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
                          uploadBrandingFile(projectId, slot.key, file)
                        );
                      }
                    }}
                  />
                </Button>
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export default BrandingFilesPanel;
