import React, { useState } from "react";
import { useSpeakers } from "providers/SpeakersContext";
import { DrawingManager, DrawingManagerProps } from "@react-google-maps/api";
import {
  Paper,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import HistoryIcon from "@material-ui/icons/History";
import MapControl from "components/common/MapControl";
import {
  getSpeakerGeoJSONObjectsForPath,
  googleMapPathToGeoJSONPath,
} from "utilities";
interface Props {}
type googleMapDrawnShapes =
  | google.maps.Circle
  | google.maps.Polygon
  | google.maps.Rectangle
  | null;
const SpeakerDrawer = (props: Props) => {
  const { selectedSpeaker, speakers } = useSpeakers();

  // `selectedSpeaker` is just an id,
  // full data by finding the speaker
  const selectedSpeakerData = React.useMemo(() => {
    return speakers?.find((s) => s.id == selectedSpeaker);
  }, [selectedSpeaker, speakers]);

  /** to keep track of current shape and remove previous from map */
  const [drawnShape, setDrawnShape] = useState<googleMapDrawnShapes>();

  /** GeoJSON polygon path of current drawn shape */
  const [drawnPaths, setDrawnPaths] = useState<number[][] | null>(null);

  /** calculate path for circle */
  const handleOnCircleComplete = (circle: google.maps.Circle) => {
    setCurrentShape(circle);
    const numPts = 512;
    const path: google.maps.LatLng[] = [];
    for (var i = 0; i < numPts; i++) {
      path.push(
        google.maps.geometry.spherical.computeOffset(
          circle.getCenter()!,
          circle.getRadius(),
          (i * 360) / numPts
        )
      );
    }
    setDrawnPaths(googleMapPathToGeoJSONPath(path));
  };

  /** set paths for polygon */
  const handleOnPolygonComplete = (polygon: google.maps.Polygon) => {
    setCurrentShape(polygon);
    setDrawnPaths(googleMapPathToGeoJSONPath(polygon.getPath().getArray()));
  };

  /** get all corners of rectangle from bounds and set path */
  const handleOnRectangleComplete = (rectangle: google.maps.Rectangle) => {
    setCurrentShape(rectangle);
    const bounds = rectangle.getBounds();
    if (!bounds) return;
    const NE = bounds.getNorthEast();
    const SW = bounds.getSouthWest();
    // North West
    const NW = new google.maps.LatLng(NE.lat(), SW.lng());
    // South East
    const SE = new google.maps.LatLng(SW.lat(), NE.lng());
    setDrawnPaths(googleMapPathToGeoJSONPath([NW, NE, SE, SW]));
  };

  /** removes previous shape from map and sets current shape */
  const setCurrentShape = (shape: googleMapDrawnShapes) => {
    setDrawnShape((prev) => {
      if (prev) prev?.setMap(null);
      setDrawnPaths(null);
      /** shows hand for editing the newly created shape */
      drawingManager?.setDrawingMode(null);
      return shape;
    });
  };

  /** reusable options for each shape in in drawinManageOptions  */
  const shapeOptions = {
    fillColor: "blue",
    fillOpacity: 0.6,
    strokeWeight: 2,
    clickable: false,
    editable: true,
    zIndex: 1,
  };
  /** options for drawing manager component */
  const drawingManagerOptions: DrawingManagerProps[`options`] = {
    drawingControlOptions: {
      drawingModes: [`circle`, `polygon`, `rectangle`].map(
        (t) =>
          //   @ts-ignore
          google.maps.drawing.OverlayType[t.toUpperCase()]
      ),
    },
    circleOptions: shapeOptions,
    polygonOptions: shapeOptions,
    rectangleOptions: shapeOptions,
  };

  /** drawing manager instance */
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager>();
  const handleLoad = (dm: google.maps.drawing.DrawingManager) => {
    setDrawingManager(dm);
  };

  /** status of async call */
  const [saving, setSaving] = useState(false);

  /* saves to db and refetch */
  const handleSave = () => {
    const { attenuation_distance } = selectedSpeakerData!;
    if (!Array.isArray(drawnPaths) || !attenuation_distance) return;
    const objects = getSpeakerGeoJSONObjectsForPath(
      drawnPaths,
      attenuation_distance
    );
  };

  /** removes current shape */
  const handleRedraw = () => setCurrentShape(null);

  if (!selectedSpeaker || selectedSpeakerData?.shape) return null;

  return (
    <div>
      <DrawingManager
        onCircleComplete={handleOnCircleComplete}
        onPolygonComplete={handleOnPolygonComplete}
        onRectangleComplete={handleOnRectangleComplete}
        onLoad={handleLoad}
        options={drawingManagerOptions}
      />
      <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
        <Paper>
          <Grid direction="column" spacing={1}>
            <Grid item>
              <Tooltip title="Save" placement="right">
                <IconButton onClick={handleSave} disabled={saving}>
                  {saving ? <CircularProgress /> : <SaveIcon />}
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Redraw" placement="right">
                <IconButton onClick={handleRedraw}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </MapControl>
    </div>
  );
};

export default SpeakerDrawer;
