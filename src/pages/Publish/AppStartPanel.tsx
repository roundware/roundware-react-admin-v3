import {
  Alert,
  Box,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useProjects } from "context/ProjectsContext";
import React, { useEffect, useState } from "react";
import { isLooping } from "../../config/fieldVisibility";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./api";
import BrandingFilesPanel from "./BrandingFilesPanel";
import { BrandingTextField } from "./brandingText";

/**
 * How the app starts (server docs/025): the splash on or off, and opening on
 * the map ("Listen first") or on Home — with Home's text and images right
 * here when it's chosen. Look & Feel's first section.
 *
 * Made for trying flows out (Halsey, 2026-10-16): every option works before
 * anything is filled in; switching keeps what was entered (Home's text and
 * images stay while Listen first is chosen); it saves as you go and the
 * preview opens on the screen being worked on; what can't apply is shown
 * disabled with the reason, not hidden.
 *
 * Mirrors the web app's src/flows.ts for what applies when.
 */
type Opening = "listen" | "home";
interface StoredFlow {
  splash?: boolean;
  opening?: Opening;
}

const HOME_FILES = ["home_background", "home_listen_image", "home_speak_image"];

interface Props {
  projectId: number;
  onSaved?: () => void;
  /** Open the preview on this path ("/" the splash, "/home", "/listen"). */
  onPreview?: (path: string) => void;
}

const AppStartPanel: React.FC<Props> = ({ projectId, onSaved, onPreview }) => {
  const { selectedProject } = useProjects();
  const [stored, setStored] = useState<StoredFlow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetcher(`/projects/${projectId}/`)
      .then(({ json }) => !cancelled && setStored({ ...((json as any)?.ui_config_json?.flow ?? {}) }))
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!stored || !selectedProject) return null;

  const listen = selectedProject.listen_enabled !== false;
  const speak = selectedProject.speak_enabled !== false;
  const kind = listen && speak ? "both" : listen ? "listenOnly" : speak ? "recordOnly" : "neither";
  // As the server resolves it (core/ui_config.effective_flow): Listen first
  // unless Home; the splash on, or off with Home, unless chosen.
  const opening: Opening = stored.opening === "home" ? "home" : "listen";
  const home = kind === "both" && opening === "home";
  const splashForced = kind === "recordOnly" || kind === "neither";
  const splash = splashForced ? true : stored.splash ?? opening !== "home";

  const save = async (next: StoredFlow) => {
    setStored(next);
    setError(null);
    try {
      // The current document, so a change made meanwhile elsewhere stays.
      const { json } = await apiFetcher(`/projects/${projectId}/`);
      const doc = { ...((json as any)?.ui_config_json ?? {}) };
      const flow = { ...next };
      if (flow.splash === undefined) delete flow.splash;
      if (flow.opening === undefined || flow.opening === "listen") delete flow.opening;
      if (Object.keys(flow).length) doc.flow = flow;
      else delete doc.flow;
      await apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ ui_config_json: doc }),
      });
      onSaved?.();
    } catch (e) {
      setError(errMessage(e));
    }
  };

  const chooseOpening = (o: Opening) => {
    // A new opening starts from its own splash default (Home: off), which
    // the author can change.
    void save({ ...stored, opening: o, splash: undefined });
    onPreview?.(o === "home" ? "/home" : "/");
  };

  const splashReason =
    kind === "recordOnly"
      ? "A record-only project always shows its splash: opening on the first recording step would be strange."
      : kind === "neither"
        ? "With Listen and Speak both off, the splash is all there is."
        : null;
  const openingReason = !listen
    ? "Home offers Listen and Speak; this project has Listen off."
    : !speak
      ? "Home offers Listen and Speak; this project has Speak off."
      : null;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">App start</Typography>
        <Typography variant="body2" color="text.secondary">
          What participants see first. Try them out: each choice shows in the preview, and nothing you
          enter is lost by switching.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={splash}
              disabled={splashForced}
              onChange={(e) => {
                void save({ ...stored, splash: e.target.checked });
                onPreview?.("/");
              }}
            />
          }
          label="Show the splash screen first"
        />
        <Typography variant="caption" color="text.secondary" display="block">
          {splashReason ??
            (home
              ? "With Home, the splash is off unless you want both: the splash as a title card, Home as the menu."
              : "Off: the app opens straight on the map.")}
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" gutterBottom>
          Then open on
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={home ? "home" : "listen"}
          disabled={kind !== "both"}
          onChange={(_e, v: Opening | null) => v && chooseOpening(v)}
        >
          <ToggleButton value="listen" sx={{ px: 2, textTransform: "none" }}>
            Listen first
          </ToggleButton>
          <ToggleButton value="home" sx={{ px: 2, textTransform: "none" }}>
            Home
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {openingReason ??
            (home
              ? "A Home screen with Listen and Speak. On the map, the logo goes back to Home; recording is the map's + as always."
              : "The map, ready to listen; recording is its + button.")}
        </Typography>
        {isLooping(selectedProject) && (
          <Typography variant="caption" color="text.secondary" display="block">
            Looping projects record with the looping recorder in either.
          </Typography>
        )}
      </Box>

      {home && (
        <Stack spacing={2} onFocusCapture={() => onPreview?.("/home")}>
          <Typography variant="subtitle2">Home</Typography>
          <BrandingTextField
            field="home_tagline"
            label="Tagline"
            multiline
            minRows={2}
            helperText="A line or two under the logo. About and the rest stay in Info."
          />
          <BrandingTextField
            field="home_listen_label"
            label="Listen button"
            helperText="Leave empty for the app's own (Listen), in each language."
          />
          <BrandingTextField
            field="home_speak_label"
            label="Speak button"
            helperText="Leave empty for the app's own (Speak), in each language."
          />
          <BrandingFilesPanel projectId={projectId} onSaved={onSaved} only={HOME_FILES} />
        </Stack>
      )}
    </Stack>
  );
};

export default AppStartPanel;
