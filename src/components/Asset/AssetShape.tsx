import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import SaveIcon from "@mui/icons-material/Save";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import {
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Tooltip,
} from "@mui/material";
import { PolygonF } from "@react-google-maps/api";
import { multiPolygon, MultiPolygon } from "@turf/helpers";
import MapControl from "components/common/MapControl";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { useDrawingManager } from "hooks/useDrawingManager";
import React, { useEffect, useMemo, useState } from "react";
import { Identifier, useNotify, useRecordContext } from "react-admin";
import { googleMapPathToGeoJSONPath, polygonToGoogleMapPaths } from "utilities";

interface AssetShapeProps {
  isDrawingMode: boolean;
  setIsDrawingMode: (v: boolean) => void;
  onShapeChange?: (hasShape: boolean) => void;
}

// Module-level shape cache — our direct dataProvider.update() calls don't
// update React Admin's React Query cache, so record.shape can be stale.
// This cache is the source of truth for shape state after save/delete.
export const shapeCache = new Map<Identifier, MultiPolygon | null>();

/** Read shape for an asset, preferring our cache over the (possibly stale) record. */
function getInitialShape(
  record: { id?: Identifier; shape?: MultiPolygon | null } | undefined
): MultiPolygon | null {
  if (record?.id != null && shapeCache.has(record.id)) {
    return shapeCache.get(record.id) ?? null;
  }
  return record?.shape ?? null;
}

const AssetShape = ({
  isDrawingMode,
  setIsDrawingMode,
  onShapeChange,
}: AssetShapeProps): JSX.Element | null => {
  const record = useRecordContext();
  const dataProvider = useRoundwareDataProvider();
  const notify = useNotify();

  const [shape, setShape] = useState<MultiPolygon | null>(() =>
    getInitialShape(record)
  );
  const [saving, setSaving] = useState(false);

  // Reset when navigating to a different asset.
  useEffect(() => {
    setShape(getInitialShape(record));
    setIsDrawingMode(false);
  }, [record?.id]);  

  // ---------------------------------------------------------------------------
  // Drawing completion handlers.
  //
  // The DrawingManager creates a Google Maps overlay (circle, polygon, or
  // rectangle).  We extract its geometry, convert to GeoJSON, set shape state,
  // and then IMMEDIATELY remove the overlay from the map.  The PolygonF
  // component takes over for display and editing.  Keeping the overlay around
  // would cause a "double shape" (two identical, overlapping, editable shapes).
  // ---------------------------------------------------------------------------

  const handleOnCircleComplete = (circle: google.maps.Circle) => {
    const numPts = 64;
    const path: google.maps.LatLng[] = [];
    for (let i = 0; i < numPts; i++) {
      path.push(
        google.maps.geometry.spherical.computeOffset(
          circle.getCenter()!,
          circle.getRadius(),
          (i * 360) / numPts
        )
      );
    }
    setShape(multiPolygon([[googleMapPathToGeoJSONPath(path)]]).geometry);
    circle.setMap(null); // remove overlay — PolygonF takes over
  };

  const handleOnPolygonComplete = (polygon: google.maps.Polygon) => {
    setShape(
      multiPolygon([
        [googleMapPathToGeoJSONPath(polygon.getPath().getArray())],
      ]).geometry
    );
    polygon.setMap(null); // remove overlay — PolygonF takes over
  };

  const handleOnRectangleComplete = (rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds();
    if (bounds) {
      const NE = bounds.getNorthEast();
      const SW = bounds.getSouthWest();
      const NW = new google.maps.LatLng(NE.lat(), SW.lng());
      const SE = new google.maps.LatLng(SW.lat(), NE.lng());
      setShape(
        multiPolygon([[googleMapPathToGeoJSONPath([NW, NE, SE, SW])]]).geometry
      );
    }
    rectangle.setMap(null); // remove overlay — PolygonF takes over
  };

  useDrawingManager({
    enabled: isDrawingMode && !shape,
    drawingModes: [
      google.maps.drawing.OverlayType.CIRCLE,
      google.maps.drawing.OverlayType.POLYGON,
      google.maps.drawing.OverlayType.RECTANGLE,
    ],
    shapeOptions: {
      fillColor: "blue",
      fillOpacity: 0.6,
      strokeWeight: 2,
      clickable: false,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
    onCircleComplete: handleOnCircleComplete,
    onPolygonComplete: handleOnPolygonComplete,
    onRectangleComplete: handleOnRectangleComplete,
  });

  // --- Editable polygon for existing / just-drawn shapes ---
  const [polygon, setPolygon] = useState<google.maps.Polygon>();
  const shapePath = useMemo(
    () => (shape ? polygonToGoogleMapPaths(shape) : null),
    [shape]
  );

  const updatePolygon = (e: google.maps.MapMouseEvent) => {
    if (e) console.info("Polygon edited");
    const newPath = polygon?.getPath().getArray();
    if (Array.isArray(newPath)) {
      setShape(
        multiPolygon([[googleMapPathToGeoJSONPath(newPath)]]).geometry
      );
    }
  };

  // --- Rotation (from SpeakerPolygon) ---
  const rotatePolygon = (angle: number) => {
    if (!shapePath || !Array.isArray(shapePath)) return;
    const center = {
      lat: shapePath.reduce((sum, p) => sum + p.lat(), 0) / shapePath.length,
      lng: shapePath.reduce((sum, p) => sum + p.lng(), 0) / shapePath.length,
    };
    const latScale = Math.cos((center.lat * Math.PI) / 180);
    const rotatedPath = shapePath.map((point) => {
      const lat = point.lat() - center.lat;
      const lng = (point.lng() - center.lng) * latScale;
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return new google.maps.LatLng(
        lat * cos - lng * sin + center.lat,
        (lat * sin + lng * cos) / latScale + center.lng
      );
    });
    setShape(multiPolygon([[googleMapPathToGeoJSONPath(rotatedPath)]]).geometry);
  };

  // --- Scaling (from SpeakerPolygon) ---
  const scalePolygon = (factor: number) => {
    if (!shapePath || !Array.isArray(shapePath)) return;
    const center = {
      lat: shapePath.reduce((sum, p) => sum + p.lat(), 0) / shapePath.length,
      lng: shapePath.reduce((sum, p) => sum + p.lng(), 0) / shapePath.length,
    };
    const latScale = Math.cos((center.lat * Math.PI) / 180);
    const scaledPath = shapePath.map((point) => {
      const lat = (point.lat() - center.lat) * factor;
      const lng = (point.lng() - center.lng) * latScale * factor;
      return new google.maps.LatLng(
        lat + center.lat,
        lng / latScale + center.lng
      );
    });
    setShape(multiPolygon([[googleMapPathToGeoJSONPath(scaledPath)]]).geometry);
  };

  // --- Save ---
  const handleSave = () => {
    if (!record?.id || !shape) return;
    setSaving(true);
    dataProvider
      .update("assets", {
        id: record.id,
        data: { shape },
        previousData: record,
      })
      .then(() => {
        shapeCache.set(record.id, shape);
        setIsDrawingMode(false);
        onShapeChange?.(true);
        notify("Shape saved", { type: "success" });
      })
      .catch((err: Error) =>
        notify(`Error saving shape: ${err.message}`, { type: "error" })
      )
      .finally(() => setSaving(false));
  };

  // --- Discard ---
  const handleDiscard = () => {
    setShape(getInitialShape(record));
    setIsDrawingMode(false);
  };

  // --- Delete ---
  const handleDelete = () => {
    if (!window.confirm("Delete the shape? You can draw a new one.")) return;
    if (!record?.id) return;
    setSaving(true);
    dataProvider
      .update("assets", {
        id: record.id,
        data: { shape: null },
        previousData: record,
      })
      .then(() => {
        setShape(null);
        shapeCache.set(record.id, null);
        setIsDrawingMode(false);
        onShapeChange?.(false);
        notify("Shape deleted", { type: "success" });
      })
      .catch((err: Error) =>
        notify(`Error deleting shape: ${err.message}`, { type: "error" })
      )
      .finally(() => setSaving(false));
  };

  // === RENDER ===

  // State 1: No shape, drawing not active → nothing on the map
  if (!shape && !isDrawingMode) return null;

  // State 2: Drawing mode, no shape yet → drawing tools + cancel
  if (!shape && isDrawingMode) {
    return (
      <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
        <Paper sx={{ margin: "8px" }}>
          <Grid direction="column" container spacing={0}>
            <Grid>
              <Tooltip title="Cancel" placement="right">
                <IconButton onClick={handleDiscard} size="medium">
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </MapControl>
    );
  }

  // State 3: Shape exists → editable polygon + controls
  return (
    <>
      {shapePath && (
        <PolygonF
          paths={shapePath}
          onMouseUp={updatePolygon}
          onLoad={(p) => setPolygon(p)}
          editable
          draggable
          options={{
            fillColor: "blue",
            fillOpacity: 0.4,
            strokeColor: "blue",
            strokeWeight: 2,
            zIndex: 1,
          }}
        />
      )}

      <MapControl position={window.google.maps.ControlPosition.LEFT_TOP}>
        <Paper
          sx={{
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            margin: "8px",
            marginTop: "10px",
          }}
        >
          <Grid container direction="column" spacing={0}>
            <Grid>
              <Tooltip title="Save Shape" placement="right">
                <IconButton onClick={handleSave} disabled={saving} size="medium">
                  {saving ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Discard Changes" placement="right">
                <IconButton onClick={handleDiscard} size="medium">
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Delete Shape" placement="right">
                <IconButton onClick={handleDelete} size="medium">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Rotate Left (5°)" placement="right">
                <IconButton onClick={() => rotatePolygon(-5)} size="medium">
                  <RotateLeftIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Rotate Right (5°)" placement="right">
                <IconButton onClick={() => rotatePolygon(5)} size="medium">
                  <RotateRightIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Scale Up (10%)" placement="right">
                <IconButton onClick={() => scalePolygon(1.1)} size="medium">
                  <ZoomOutMapIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid>
              <Tooltip title="Scale Down (10%)" placement="right">
                <IconButton onClick={() => scalePolygon(0.9)} size="medium">
                  <ZoomInMapIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </MapControl>
    </>
  );
};

export default AssetShape;
