import React, { useEffect, useState } from "react";
import { useSpeakers } from "providers/SpeakersContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import {
  DrawingManager,
  DrawingManagerProps,
  Polygon,
  Polyline,
} from "@react-google-maps/api";
import {
  Paper,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import HistoryIcon from "@mui/icons-material/History";
import MapControl from "components/common/MapControl";
import {
  getSpeakerGeoJSONObjectsForPath,
  googleMapPathToGeoJSONPath,
  polygonToGoogleMapPaths,
} from "utilities";
import useFieldValue from "hooks/useFieldValue";
import { multiPolygon, MultiPolygon } from "@turf/helpers";

type googleMapDrawnShapes =
  | google.maps.Circle
  | google.maps.Polygon
  | google.maps.Rectangle
  | null;
const AssetShape = (): JSX.Element | null => {
  const [assetShape, setAssetShape] = useFieldValue<MultiPolygon | undefined>(
    `shape`
  );
  /** to keep track of current shape and remove previous from map */
  const [drawnShape, setDrawnShape] = useState<googleMapDrawnShapes>();

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

  useEffect(() => {
    if (drawnPaths) setAssetShape(multiPolygon([[drawnPaths]]).geometry);
  }, [drawnPaths]);

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

  /** removes current shape */
  const handleRedraw = () => {
    setCurrentShape(null);
    setAssetShape(undefined);
  };
  const polylineOptions = {
    strokeColor: "#000000",
    strokeOpacity: 0.1,
    icons: [
      {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillOpacity: 0.5,
          scale: 1,
        },
        offset: "0",
        repeat: "10px",
      },
    ],
  };

  const [polygon, setPolygon] = useState<google.maps.Polygon>();
  const handleOnPolygonLoad = (loadedPolygon: google.maps.Polygon) =>
    setPolygon(loadedPolygon);
  const updatePolygon = (e: google.maps.MapMouseEvent) => {
    if (e) console.info(`Polygon edited`);

    const newPath = polygon?.getPath().getArray();

    if (Array.isArray(newPath)) {
      const newMultiPolygon = multiPolygon([
        [googleMapPathToGeoJSONPath(newPath)],
      ]).geometry;
      setAssetShape(newMultiPolygon);
    }
  };
  /** if selected asset already has a shape don't show drawing manager */

  return (
    <div>
      {assetShape ? (
        <>
          {/* editable shape */}
          <Polygon
            paths={polygonToGoogleMapPaths(assetShape)}
            onMouseUp={updatePolygon}
            onLoad={handleOnPolygonLoad}
            editable
          />
        </>
      ) : (
        <DrawingManager
          onCircleComplete={handleOnCircleComplete}
          onPolygonComplete={handleOnPolygonComplete}
          onRectangleComplete={handleOnRectangleComplete}
          onLoad={handleLoad}
          options={drawingManagerOptions}
          onUnmount={() => {
            drawnShape?.setMap(null);
          }}
        />
      )}
      <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
        <Paper>
          <Grid direction="column" spacing={1}>
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

export default AssetShape;
