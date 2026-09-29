import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useProjects } from "context/ProjectsContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import webAppDefaults from "../../config/webAppDefaults.json";
import webAppMapStyle from "../../config/webAppMapStyle.json";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import {
  createImageOverlay,
  MapOverlayPlacement,
} from "../../utilities/mapOverlayGeometry";
import { mapLibraries, mapsApiVersion } from "../../utils";
import { errMessage, getBranding } from "./api";

/**
 * One map for everything about how the listen map looks: the Google Maps
 * style, and the placement of the project's overlay image.
 *
 * It draws with the web app's own geometry (utilities/mapOverlayGeometry.ts,
 * a twin of the app's copy) and the web app's built-in style (vendored as
 * webAppMapStyle.json), so what an author arranges here is what participants
 * see. Both settings are ordinary project config — `map.mapOverlay`,
 * `map.listenMapOverlayDisplay` and `map.googleMapsStyle` in ui_config_json —
 * so the Advanced configuration panel shows the same values.
 *
 * Saving is explicit rather than automatic, unlike the rest of this page:
 * dragging an overlay into place is dozens of intermediate positions, and
 * none of them should reach a live project.
 */

interface Props {
  projectId: number;
  onSaved?: () => void;
  /**
   * Bumped by the page whenever branding is saved, uploads included. The
   * overlay image is uploaded in another panel; without this the editor only
   * learned of it on a page reload, so its overlay controls stayed hidden
   * after the first upload.
   */
  brandingVersion?: number;
}

interface OverlayConfig {
  latitude: number | null;
  longitude: number | null;
  widthMeters: number;
  rotation: number;
  opacity: number;
}

const DEFAULT_MAP = (webAppDefaults as { defaults: { map: Record<string, any> } })
  .defaults.map;
const DEFAULT_OVERLAY: OverlayConfig = DEFAULT_MAP.mapOverlay;
const BUILT_IN_STYLE = (webAppMapStyle as { style: google.maps.MapTypeStyle[] }).style;

const containerStyle = { width: "100%", height: "480px" };

/** Parse the style box. Empty means "use the built-in". */
const parseStyle = (
  text: string
): { style: google.maps.MapTypeStyle[] | null; error: string | null } => {
  if (!text.trim()) return { style: null, error: null };
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return { style: null, error: "A map style is a JSON array of rules." };
    }
    return { style: parsed, error: null };
  } catch (e) {
    return { style: null, error: `Not valid JSON: ${(e as Error).message}` };
  }
};

const MapAppearanceEditor: React.FC<Props> = ({ projectId, onSaved, brandingVersion }) => {
  const { selectedProject } = useProjects();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const projectCenter = useMemo(
    () => ({
      lat: selectedProject?.latitude ?? 0,
      lng: selectedProject?.longitude ?? 0,
    }),
    [selectedProject?.latitude, selectedProject?.longitude]
  );

  const [loaded, setLoaded] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [center, setCenter] = useState(projectCenter);
  const [widthMeters, setWidthMeters] = useState(DEFAULT_OVERLAY.widthMeters);
  const [rotation, setRotation] = useState(DEFAULT_OVERLAY.rotation);
  const [opacity, setOpacity] = useState(DEFAULT_OVERLAY.opacity);
  const [styleText, setStyleText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const { style: parsedStyle, error: styleError } = parseStyle(styleText);

  // What is on disk, so "Revert" has something to go back to.
  const savedRef = useRef<{
    enabled: boolean;
    overlay: OverlayConfig;
    styleText: string;
  } | null>(null);

  const applySaved = useCallback(
    (s: NonNullable<typeof savedRef.current>) => {
      setEnabled(s.enabled);
      setCenter(
        typeof s.overlay.latitude === "number" && typeof s.overlay.longitude === "number"
          ? { lat: s.overlay.latitude, lng: s.overlay.longitude }
          : projectCenter
      );
      setWidthMeters(s.overlay.widthMeters);
      setRotation(s.overlay.rotation);
      setOpacity(s.overlay.opacity);
      setStyleText(s.styleText);
      setDirty(false);
    },
    [projectCenter]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetcher(`/projects/${projectId}/`), getBranding(projectId)])
      .then(([{ json: project }, branding]) => {
        if (cancelled) return;
        const map = (project?.ui_config_json?.map ?? {}) as Record<string, any>;
        const overlay: OverlayConfig = { ...DEFAULT_OVERLAY, ...(map.mapOverlay ?? {}) };
        const saved = {
          enabled: Boolean(map.listenMapOverlayDisplay ?? DEFAULT_MAP.listenMapOverlayDisplay),
          overlay,
          styleText: Array.isArray(map.googleMapsStyle)
            ? JSON.stringify(map.googleMapsStyle, null, 2)
            : "",
        };
        savedRef.current = saved;
        applySaved(saved);
        setOverlayUrl(branding.files?.map_overlay?.urls?.[0] ?? null);
        setLoaded(true);
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId, applySaved]);

  // Re-read just the image after a branding save — not the placement, which
  // may hold unsaved edits. The first load above already has it.
  const firstBrandingVersion = useRef(brandingVersion);
  useEffect(() => {
    if (brandingVersion === firstBrandingVersion.current) return;
    let cancelled = false;
    getBranding(projectId)
      .then((branding) => {
        if (!cancelled) setOverlayUrl(branding.files?.map_overlay?.urls?.[0] ?? null);
      })
      .catch(() => undefined); // Keeps the image it had; a reload will catch up.
    return () => {
      cancelled = true;
    };
  }, [projectId, brandingVersion]);

  // ---- The overlay, drawn with the web app's geometry ----------------------
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const overlayRef = useRef<ReturnType<typeof createImageOverlay> | null>(null);
  const placement: MapOverlayPlacement = { center, widthMeters, rotation, opacity };

  useEffect(() => {
    if (!map || !overlayUrl) return;
    const overlay = createImageOverlay(overlayUrl, placement);
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
    // Rebuilt only when the map or image changes; placement updates in place.
  }, [map, overlayUrl]);

  useEffect(() => {
    overlayRef.current?.setPlacement(placement);
  }, [center.lat, center.lng, widthMeters, rotation, opacity]);

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
    setSavedNote(null);
  };

  // ---- Save -----------------------------------------------------------------
  const save = async () => {
    if (styleError) return;
    setSaving(true);
    setError(null);
    try {
      // Merge into the *current* document rather than the one loaded at mount,
      // so a change made meanwhile in Advanced configuration is not clobbered.
      const { json: project } = await apiFetcher(`/projects/${projectId}/`);
      const doc = { ...(project?.ui_config_json ?? {}) } as Record<string, any>;
      const mapSection = { ...(doc.map ?? {}) };
      mapSection.listenMapOverlayDisplay = enabled;
      mapSection.mapOverlay = {
        latitude: center.lat,
        longitude: center.lng,
        widthMeters,
        rotation,
        opacity,
      };
      if (parsedStyle) mapSection.googleMapsStyle = parsedStyle;
      else delete mapSection.googleMapsStyle; // back to the built-in
      doc.map = mapSection;

      await apiFetcher(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify({ ui_config_json: doc }),
      });

      savedRef.current = {
        enabled,
        overlay: mapSection.mapOverlay,
        styleText,
      };
      setDirty(false);
      setSavedNote("Saved. The preview above now shows it.");
      onSaved?.();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (error && !loaded) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!loaded || !isLoaded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6">Map appearance</Typography>
          <Typography variant="body2" color="text.secondary">
            The map style and overlay image participants see on the listen map.
            The style also applies to the location picker when recording.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {dirty && (
            <Button
              size="small"
              onClick={() => savedRef.current && applySaved(savedRef.current)}
              disabled={saving}
            >
              Revert
            </Button>
          )}
          <Button
            variant="contained"
            onClick={save}
            disabled={!dirty || saving || Boolean(styleError)}
          >
            {saving ? "Saving…" : "Save map"}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {savedNote && !dirty && <Alert severity="success">{savedNote}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={projectCenter}
            zoom={18}
            onLoad={setMap}
            onUnmount={() => setMap(null)}
            options={{
              styles: parsedStyle ?? BUILT_IN_STYLE,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {overlayUrl && (
              <MarkerF
                position={center}
                draggable
                title="Drag to move the overlay"
                onDrag={(e) => {
                  const p = e.latLng;
                  if (p) touch(setCenter)({ lat: p.lat(), lng: p.lng() });
                }}
              />
            )}
          </GoogleMap>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Overlay image
              </Typography>
              {overlayUrl ? (
                <FormControlLabel
                  control={
                    <Switch checked={enabled} onChange={(e) => touch(setEnabled)(e.target.checked)} />
                  }
                  label={enabled ? "Shown to participants" : "Hidden from participants"}
                />
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Upload a <strong>Map overlay</strong> image under Images &amp; audio
                  to place one here.
                </Alert>
              )}
            </Box>

            {overlayUrl && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Drag the pin to move it. It is drawn here exactly as the app
                  draws it, whether or not it is shown to participants yet.
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Width on the ground — {Math.round(widthMeters)} m
                  </Typography>
                  <Slider
                    value={widthMeters}
                    min={5}
                    max={1000}
                    step={1}
                    onChange={(_e, v) => touch(setWidthMeters)(v as number)}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rotation — {Math.round(rotation)}°
                  </Typography>
                  <Slider
                    value={rotation}
                    min={-180}
                    max={180}
                    step={0.5}
                    marks={[{ value: 0 }]}
                    onChange={(_e, v) => touch(setRotation)(v as number)}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Opacity — {Math.round(opacity * 100)}%
                  </Typography>
                  <Slider
                    value={opacity}
                    min={0.05}
                    max={1}
                    step={0.05}
                    onChange={(_e, v) => touch(setOpacity)(v as number)}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      const c = map?.getCenter();
                      if (c) touch(setCenter)({ lat: c.lat(), lng: c.lng() });
                    }}
                  >
                    Move to map centre
                  </Button>
                  <Button size="small" onClick={() => touch(setCenter)(projectCenter)}>
                    Project location
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">Google Maps style</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => touch(setStyleText)(JSON.stringify(BUILT_IN_STYLE, null, 2))}
            >
              Start from the built-in style
            </Button>
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              disabled={!styleText}
              onClick={() => touch(setStyleText)("")}
            >
              Use built-in
            </Button>
          </Stack>
        </Stack>
        <TextField
          value={styleText}
          onChange={(e) => touch(setStyleText)(e.target.value)}
          placeholder="Empty uses Roundware's built-in style. Paste a style array from mapstyle.withgoogle.com or snazzymaps.com to replace it."
          multiline
          minRows={4}
          maxRows={14}
          fullWidth
          size="small"
          error={Boolean(styleError)}
          helperText={
            styleError ??
            (parsedStyle
              ? `Custom style, ${parsedStyle.length} rule${parsedStyle.length === 1 ? "" : "s"} — previewing above.`
              : "Using the built-in style.")
          }
          sx={{ mt: 1, "& textarea": { fontFamily: "monospace", fontSize: 12 } }}
        />
      </Box>
    </Stack>
  );
};

export default MapAppearanceEditor;
