import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import {
  GoogleMap,
  PolygonF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { multiPolygon, MultiPolygon } from "@turf/helpers";
import { useDrawingManager } from "hooks/useDrawingManager";
import React, { useCallback, useMemo, useState } from "react";
import { googleMapPathToGeoJSONPath, polygonToGoogleMapPaths } from "utilities";
import { mapLibraries, mapsApiVersion } from "../../../utils";

/**
 * Draw a speaker's coverage area during project creation.
 *
 * This exists because a speaker without a shape **crashes the web app**: Turf
 * throws "polygon or multi-polygon is required" the moment the listener's
 * location is set, which happens before the app finishes booting, so the
 * project never becomes ready. Until now the wizard said shapes could be drawn
 * later and posted speakers with `shape: null`, which made every project it
 * created dead on arrival.
 *
 * Unlike `SpeakerShapesControl` and `AssetShape`, this is a plain controlled
 * input: the wizard's speakers are unsaved temp objects with no record context
 * and no id, so it takes a value and an onChange rather than talking to the
 * data provider. It intentionally offers draw-and-clear only — the rotate,
 * scale and vertex editing in the full speaker form belong to refinement after
 * the project exists.
 */

interface Props {
  value: MultiPolygon | null;
  onChange: (shape: MultiPolygon | null) => void;
  /** Map centre when nothing is drawn yet — the project location. */
  center: { lat: number; lng: number };
}

const containerStyle = { width: "100%", height: "320px" };

/** A circle has no polygon path, so approximate it. 32 points is smooth enough
 *  at any zoom a speaker is drawn at, and keeps the stored GeoJSON small. */
const CIRCLE_POINTS = 32;

const WizardSpeakerShape: React.FC<Props> = ({ value, onChange, center }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const [drawingModes, setDrawingModes] = useState<
    google.maps.drawing.OverlayType[]
  >([]);

  // Only offer the toolbar while there is nothing drawn; clearing brings it back.
  const hasShape = Boolean(value);

  // The wizard only ever draws a single ring, and polygonToGoogleMapPaths
  // returns exactly that, so one PolygonF is enough.
  const paths = useMemo(() => {
    if (!value) return null;
    try {
      return polygonToGoogleMapPaths(value);
    } catch {
      return null;
    }
  }, [value]);

  const handleCircle = useCallback(
    (circle: google.maps.Circle) => {
      const path: google.maps.LatLng[] = [];
      for (let i = 0; i < CIRCLE_POINTS; i++) {
        path.push(
          google.maps.geometry.spherical.computeOffset(
            circle.getCenter()!,
            circle.getRadius(),
            (i * 360) / CIRCLE_POINTS
          )
        );
      }
      onChange(multiPolygon([[googleMapPathToGeoJSONPath(path)]] as any).geometry);
      circle.setMap(null); // PolygonF renders it from here
    },
    [onChange]
  );

  const handlePolygon = useCallback(
    (polygon: google.maps.Polygon) => {
      onChange(
        multiPolygon([
          [googleMapPathToGeoJSONPath(polygon.getPath().getArray())],
        ] as any).geometry
      );
      polygon.setMap(null);
    },
    [onChange]
  );

  const handleRectangle = useCallback(
    (rectangle: google.maps.Rectangle) => {
      const bounds = rectangle.getBounds();
      if (bounds) {
        const NE = bounds.getNorthEast();
        const SW = bounds.getSouthWest();
        const NW = new google.maps.LatLng(NE.lat(), SW.lng());
        const SE = new google.maps.LatLng(SW.lat(), NE.lng());
        onChange(
          multiPolygon([
            [googleMapPathToGeoJSONPath([NW, NE, SE, SW])],
          ] as any).geometry
        );
      }
      rectangle.setMap(null);
    },
    [onChange]
  );

  if (!isLoaded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="body2" color={hasShape ? "text.secondary" : "error"}>
          {hasShape
            ? "Coverage area set. Clear it to draw a different one."
            : "Draw this speaker's coverage area — required."}
        </Typography>
        {hasShape && (
          <Button size="small" startIcon={<DeleteIcon />} onClick={() => onChange(null)}>
            Clear
          </Button>
        )}
      </Stack>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        <DrawingTools
          enabled={!hasShape}
          modes={drawingModes}
          setModes={setDrawingModes}
          onCircle={handleCircle}
          onPolygon={handlePolygon}
          onRectangle={handleRectangle}
        />
        {paths && (
          <PolygonF
            paths={paths}
            options={{
              fillColor: "#3f51b5",
              fillOpacity: 0.3,
              strokeColor: "#1a237e",
              strokeWeight: 2,
              clickable: false,
            }}
          />
        )}
      </GoogleMap>
    </Box>
  );
};

/** Split out because useDrawingManager needs to be inside <GoogleMap>, where
 *  useGoogleMap() can reach the map instance. */
const DrawingTools: React.FC<{
  enabled: boolean;
  modes: google.maps.drawing.OverlayType[];
  setModes: (m: google.maps.drawing.OverlayType[]) => void;
  onCircle: (c: google.maps.Circle) => void;
  onPolygon: (p: google.maps.Polygon) => void;
  onRectangle: (r: google.maps.Rectangle) => void;
}> = ({ enabled, modes, setModes, onCircle, onPolygon, onRectangle }) => {
  // The OverlayType enum only exists once the maps script has loaded, so it
  // cannot be a module-level constant.
  React.useEffect(() => {
    if (modes.length === 0 && typeof google !== "undefined") {
      setModes([
        google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.RECTANGLE,
      ]);
    }
  }, [modes.length, setModes]);

  useDrawingManager({
    enabled,
    drawingModes: modes,
    shapeOptions: {
      fillColor: "#3f51b5",
      fillOpacity: 0.3,
      strokeColor: "#1a237e",
      strokeWeight: 2,
    },
    onCircleComplete: onCircle,
    onPolygonComplete: onPolygon,
    onRectangleComplete: onRectangle,
  });

  return null;
};

export default WizardSpeakerShape;
