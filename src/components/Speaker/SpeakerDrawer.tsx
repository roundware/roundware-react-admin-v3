import HistoryIcon from "@mui/icons-material/History";
import SaveIcon from "@mui/icons-material/Save";
import {
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Tooltip,
} from "@mui/material";
import { DrawingManager, DrawingManagerProps } from "@react-google-maps/api";
import MapControl from "components/common/MapControl";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { useSpeakers } from "context/SpeakersContext";
import React, { useEffect, useState } from "react";
import {
    getSpeakerGeoJSONObjectsForPath,
    googleMapPathToGeoJSONPath,
} from "utilities";

type googleMapDrawnShapes =
  | google.maps.Circle
  | google.maps.Polygon
  | google.maps.Rectangle
  | null;
const SpeakerDrawer = (): JSX.Element | null => {
  const {
    selectedSpeaker,
    speakers,
    fetchData,
    setSelectedSpeaker,
    setIsCurrentSpeakerSaved,
  } = useSpeakers();
  const dataProvider = useRoundwareDataProvider();
  // `selectedSpeaker` is just an id,
  // full data by finding the speaker
  const selectedSpeakerData = React.useMemo(() => {
    return speakers?.find((s) => s.id == selectedSpeaker);
  }, [selectedSpeaker, speakers]);

  /** to keep track of current shape and remove previous from map */
  const [, setDrawnShape] = useState<googleMapDrawnShapes>();

  /** GeoJSON polygon path of current drawn shape */
  const [drawnPaths, setDrawnPaths] = useState<number[][] | null>(null);

  /** listeners for keeping track when shape is edited */
  const [listeners, setListeners] = useState<google.maps.MapsEventListener[]>(
    []
  );

  /** on new circle drawn */
  const handleOnCircleComplete = (circle: google.maps.Circle) => {
    setCurrentShape(circle);

    /** setup listeners to get new paths when circle is edited */
    const circleListeners = [`radius_changed`, `center_changed`].map((e) =>
      google.maps.event.addListener(circle, e, () => getPathsFromCircle(circle))
    );
    /** save listeners to clear when new shape drawn */
    setListeners(circleListeners);

    getPathsFromCircle(circle);
  };

  /** calculate paths from given circle */
  const getPathsFromCircle = (circle: google.maps.Circle) => {
    const numPts = 64;
    const path: google.maps.LatLng[] = [];
    for (let i = 0; i < numPts; i++) {
      path.push(
        google.maps.geometry.spherical.computeOffset(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          circle.getCenter()!,
          circle.getRadius(),
          (i * 360) / numPts
        )
      );
    }

    setDrawnPaths(googleMapPathToGeoJSONPath(path));
  };

  /** on new polygon,  sets listeners for edit changes for polygon */
  const handleOnPolygonComplete = (polygon: google.maps.Polygon) => {
    setCurrentShape(polygon);
    /** listeners for edit changes */
    const polygonListeners = [
      `insert_at`,
      `remove_at`,
      `set_at`,
      `dragend`,
      `mouseup`,
    ].map((e) =>
      google.maps.event.addListener(polygon, e, () =>
        getPathFromPolygon(polygon)
      )
    );
    setListeners(polygonListeners);
    getPathFromPolygon(polygon);
  };

  /** gets path from given polygon */
  const getPathFromPolygon = (polygon: google.maps.Polygon) => {
    setDrawnPaths(googleMapPathToGeoJSONPath(polygon.getPath().getArray()));
  };

  /** on new rectangle shape */
  const handleOnRectangleComplete = (rectangle: google.maps.Rectangle) => {
    setCurrentShape(rectangle);
    const rectangleListeners = [`bounds_changed`].map((e) =>
      google.maps.event.addListener(rectangle, e, () =>
        getPathFromRectangle(rectangle)
      )
    );
    setListeners(rectangleListeners);
    getPathFromRectangle(rectangle);
  };

  /** calculates paths from givem rectangle */
  const getPathFromRectangle = (rectangle: google.maps.Rectangle) => {
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

  /** removes previous shape from map & paths and sets current shape
   *  NOTE: this must be called before saving new paths of shape
   */
  const setCurrentShape = (shape: googleMapDrawnShapes) => {
    setDrawnShape((prev) => {
      if (prev) prev?.setMap(null);
      /** remove previous paths */
      setDrawnPaths(null);
      /** shows hand for editing the newly created shape */
      drawingManager?.setDrawingMode(null);
      /** remove previous listeners */
      listeners.forEach((l) => l.remove());
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
    draggable: true,
    zIndex: 1,
  };
  /** options for drawing manager component */
  const drawingManagerOptions: DrawingManagerProps[`options`] = {
    drawingControlOptions: {
      drawingModes: [`circle`, `polygon`, `rectangle`].map(
        (t) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { attenuation_distance } = selectedSpeakerData!;
    if (!Array.isArray(drawnPaths) || !attenuation_distance) return;
    const objects = getSpeakerGeoJSONObjectsForPath(
      drawnPaths,
      attenuation_distance
    );
    dataProvider
      .update(`speakers`, {
        data: {
          ...selectedSpeakerData,
          ...objects,
        },
        id: Number(selectedSpeaker),
        previousData: {
          id: Number(selectedSpeaker),
          ...selectedSpeakerData,
        },
      })
      .then(() => {
        setIsCurrentSpeakerSaved(true);
        /** remove drawn shape */
        handleRedraw();
        /** deselect speaker */
        setSelectedSpeaker(null);
        /** get new saved speakers data */
        fetchData();
      })
      .finally(() => setSaving(false));
  };

  // Only set unsaved when we actually start drawing a new shape
  useEffect(() => {
    if (selectedSpeaker && !selectedSpeakerData?.shape && drawnPaths) {
      setIsCurrentSpeakerSaved(false);
    }
  }, [drawnPaths, selectedSpeaker, selectedSpeakerData?.shape]);

  /** removes current shape */
  const handleRedraw = () => setCurrentShape(null);

  /** if selected speaker already has a shape don't show drawing manager */
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
                <IconButton onClick={handleSave} disabled={saving} size="large">
                  {saving ? <CircularProgress /> : <SaveIcon />}
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Redraw" placement="right">
                <IconButton onClick={handleRedraw} size="large">
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
