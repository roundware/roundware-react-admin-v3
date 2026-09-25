import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import {
  GoogleMap,
  PolygonF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { multiPolygon, MultiPolygon } from "@turf/helpers";
import { useDrawingManager } from "hooks/useDrawingManager";
import React, { useCallback, useMemo } from "react";
import { googleMapPathToGeoJSONPath, polygonToGoogleMapPaths } from "utilities";
import { mapLibraries, mapsApiVersion } from "../../utils";

/**
 * Draw a speaker's coverage area.
 *
 * This exists because a speaker without a shape **crashes the web app**: Turf
 * throws "polygon or multi-polygon is required" the moment the listener's
 * location is set, which happens before the app finishes booting, so the
 * project never becomes ready. Until now the wizard said shapes could be drawn
 * later and posted speakers with `shape: null`, which made every project it
 * created dead on arrival.
 *
 * Unlike `SpeakerShapesControl` and `AssetShape`, this is a plain controlled
 * input: it takes a value and an onChange rather than talking to the data
 * provider, so it works for a speaker that does not exist yet — the wizard's
 * unsaved temp objects, and the Create form, both of which have no record and
 * no id. It offers draw-and-clear only; the rotate, scale and vertex editing on
 * the Speakers map is for refining a shape once the speaker exists.
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

const ShapeDrawInput: React.FC<Props> = ({ value, onChange, center }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

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
  onCircle: (c: google.maps.Circle) => void;
  onPolygon: (p: google.maps.Polygon) => void;
  onRectangle: (r: google.maps.Rectangle) => void;
}> = ({ enabled, onCircle, onPolygon, onRectangle }) => {
  // Built inline, at render. The OverlayType enum only exists once the maps
  // script has loaded, which is why this cannot be a module constant — but
  // deferring it through state and an effect is worse: useDrawingManager
  // builds its DrawingManager on first run, so the toolbar was created from
  // the empty initial array and stayed empty. This component only renders
  // inside <GoogleMap>, which only mounts once the script has loaded, so the
  // enum is already there.
  const modes = React.useMemo(
    () => [
      google.maps.drawing.OverlayType.CIRCLE,
      google.maps.drawing.OverlayType.POLYGON,
      google.maps.drawing.OverlayType.RECTANGLE,
    ],
    []
  );

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

export default ShapeDrawInput;
