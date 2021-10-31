import React, { useMemo, useState, useEffect, useRef } from "react";
import { ISpeaker } from "types/speaker";
import {
  Polygon,
  PolygonProps,
  InfoWindow,
  useGoogleMap,
  Polyline,
  PolylineProps,
} from "@react-google-maps/api";
import {
  Toolbar,
  Tooltip,
  IconButton,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { polygonToGoogleMapPaths } from "utilities";
import DeleteIcon from "@material-ui/icons/Delete";
import SaveIcon from "@material-ui/icons/Save";
import HistoryIcon from "@material-ui/icons/History";
import { useSpeakers } from "providers/SpeakersContext";
import buffer from "@turf/buffer";
import MapControl from "components/common/MapControl";
import { multiPolygon } from "@turf/helpers";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import booleanEqual from "@turf/boolean-equal";
interface Props {
  speaker: ISpeaker;
}
/**
 * this will render all the necesarry polygons for an individual speaker
 */
const SpeakerPolygonsGroup = ({ speaker }: Props) => {
  const { selectedSpeaker, fetchData, setSelectedSpeaker } = useSpeakers();
  const isSelected = selectedSpeaker == speaker.id;
  const map = useGoogleMap();
  const [shape, setShape] = useState(speaker.shape);
  const [distance, setDistance] = useState(speaker.attenuation_distance);

  const dataProvider = useRoundwareDataProvider();

  useEffect(() => {
    if (isSelected) {
      // @ts-ignore
      map?.fitBounds(polygon?.getBounds());
    }
  }, [isSelected]);

  // the editable shape
  const shapePolygonOptions: PolygonProps[`options`] = {
    fillColor: "lightblue",
    fillOpacity: isSelected ? 0.6 : 0,
    strokeColor: "red",
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: true,
    draggable: isSelected,
    editable: isSelected,
    geodesic: false,
    zIndex: 3,
  };

  const attenuationBorderOptions = {
    fillOpacity: 0,
    strokeColor: isSelected ? `#ff0000` : "#000000",
    strokeOpacity: 1,
    strokeWeight: 1,
    clickable: true,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 2,
  };

  // the inner border, should not be editable
  const attenuationBorderPath = useMemo(() => {
    const polygon = buffer(shape, -distance, {
      units: "meters",
    });
    return polygonToGoogleMapPaths(polygon.geometry);
  }, [shape, distance]);

  const shapePath = useMemo(() => {
    return polygonToGoogleMapPaths(shape);
  }, [shape]);

  const [dragging, setDragging] = useState(false);

  const handleDragStart = () => setDragging(true);
  const updatePolygon = (e: google.maps.MapMouseEvent) => {
    setDragging(false);
    const newPath = polygon
      ?.getPath()
      .getArray()
      .map((p) => [p.lng(), p.lat()]);

    if (Array.isArray(newPath)) {
      const newMultiPolygon = multiPolygon([[newPath]]).geometry;
      setShape(newMultiPolygon);
    }

    // if (Array.isArray(newPath)) {
    //   setShape(multiPolygon(newPath.map(p => p.))
    // }
  };
  const [polygon, setPolygon] = useState<google.maps.Polygon>();
  const handleOnPolygonLoad = (loadedPolygon: google.maps.Polygon) =>
    setPolygon(loadedPolygon);

  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    setSaving(true);
    dataProvider
      .update(`speakers`, {
        id: speaker.id,
        data: {
          ...speaker,
          shape,
        },
        previousData: {
          ...speaker,
        },
      })
      .then(() => fetchData())
      .finally(() => setSaving(false));
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

  const handleDiscard = () => setShape(speaker.shape);

  const handleDelete = () => {};

  const handleDblClick = () => {
    if (selectedSpeaker != speaker.id) {
      setSelectedSpeaker(speaker.id);
    }
  };
  return (
    <div>
      {/* original shape */}
      <Polyline
        path={polygonToGoogleMapPaths(speaker.shape)}
        draggable={false}
        options={polylineOptions}
      />
      {/* editable shape */}
      <Polygon
        paths={shapePath}
        onDragStart={handleDragStart}
        // onDragEnd={updatePolygon}
        onMouseUp={updatePolygon}
        onLoad={handleOnPolygonLoad}
        onDblClick={handleDblClick}
        options={shapePolygonOptions}
      />

      <Polygon
        paths={attenuationBorderPath}
        options={attenuationBorderOptions}
        visible={!dragging}
      />

      {isSelected && (
        <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
          <Paper>
            <Grid direction="column" spacing={1}>
              <Grid item>
                <Tooltip title="Save Changes" placement="right">
                  <IconButton onClick={handleSave} disabled={saving}>
                    {saving ? <CircularProgress /> : <SaveIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Discard Changes" placement="right">
                  <IconButton onClick={handleDiscard}>
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Delete Shape" placement="right">
                  <IconButton onClick={handleDelete}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </MapControl>
      )}
    </div>
  );
};

export default SpeakerPolygonsGroup;
