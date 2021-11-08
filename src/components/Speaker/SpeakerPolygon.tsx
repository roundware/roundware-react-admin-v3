import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Popover,
  Box,
  TextField,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import HistoryIcon from "@material-ui/icons/History";
import SaveIcon from "@material-ui/icons/Save";
import BlurCircularIcon from "@material-ui/icons/BlurCircular";
import {
  Polygon,
  PolygonProps,
  Polyline,
  useGoogleMap,
} from "@react-google-maps/api";
import buffer from "@turf/buffer";
import { multiPolygon } from "@turf/helpers";
import MapControl from "components/common/MapControl";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useSpeakers } from "providers/SpeakersContext";
import React, { useEffect, useMemo, useState } from "react";
import { ISpeaker } from "types/speaker";
import {
  polygonToGoogleMapPaths,
  getSpeakerGeoJSONObjectsForPath,
  googleMapPathToGeoJSONPath,
} from "utilities";
import useDebounce from "hooks/useDebounce";
interface Props {
  speaker: ISpeaker;
}
/**
 * this will render all the necesarry polygons for an individual speaker
 */
const SpeakerPolygonsGroup = ({ speaker }: Props): JSX.Element => {
  const { selectedSpeaker, fetchData, setSelectedSpeaker, setSpeakers } =
    useSpeakers();
  const isSelected = selectedSpeaker == speaker.id;
  const map = useGoogleMap();
  const [shape, setShape] = useState(speaker.shape);
  const [distance, setDistance] = useState(
    Number(speaker.attenuation_distance)
  );

  const dataProvider = useRoundwareDataProvider();

  useEffect(() => {
    if (isSelected) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      map?.fitBounds(polygon?.getBounds());
    }
  }, [isSelected]);

  // the editable shape
  const shapePolygonOptions: PolygonProps[`options`] = {
    fillColor: speaker.activeyn ? `gray` : "lightblue",
    fillOpacity: isSelected ? 0.5 : 0,
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

  const debouncedDistance = useDebounce(distance, 1000);
  // the inner border, should not be editable
  const attenuationBorderPath = useMemo(() => {
    const polygon = buffer(shape, -distance, {
      units: "meters",
    });
    return polygonToGoogleMapPaths(polygon.geometry);
  }, [shape, debouncedDistance]);

  const shapePath = useMemo(() => {
    return polygonToGoogleMapPaths(shape);
  }, [shape]);

  const [dragging, setDragging] = useState(false);

  const handleDragStart = () => setDragging(true);
  const updatePolygon = (e: google.maps.MapMouseEvent) => {
    if (e) console.log(`Polygon edited`);
    setDragging(false);
    const newPath = polygon
      ?.getPath()
      .getArray()
      .map((p) => [p.lng(), p.lat()]);

    if (Array.isArray(newPath)) {
      const newMultiPolygon = multiPolygon([[newPath]]).geometry;
      setShape(newMultiPolygon);
    }
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
          ...getSpeakerGeoJSONObjectsForPath(
            googleMapPathToGeoJSONPath(shapePath),
            distance
          ),
          attenuation_distance: distance,
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

  const handleDelete = () => {
    const confirmation = window.confirm(
      `Deleting a speaker will only allow you to draw a new shape`
    );
    if (confirmation) {
      setSpeakers((s) => {
        const sps = [...(s || [])].filter((s) => s?.id != selectedSpeaker);
        sps.push({
          ...s?.find((s) => s.id == selectedSpeaker),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          shape: undefined,
          attenuation_border: undefined,
          boundary: undefined,
        });
        return sps;
      });
    }
  };

  const handleDblClick = () => {
    if (selectedSpeaker != speaker.id) {
      setSelectedSpeaker(speaker.id);
    }
  };

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const handleOpenAD: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setAnchorEl(e.currentTarget || null);
  };

  const handleCloseAD = () => setAnchorEl(null);

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
              <Grid item>
                <Tooltip title="Attenuation Distance" placement="right">
                  <IconButton onClick={handleOpenAD}>
                    <BlurCircularIcon />
                  </IconButton>
                </Tooltip>
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={handleCloseAD}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                >
                  <Box p={3}>
                    <TextField
                      label="Attenuation Distance"
                      type="number"
                      defaultValue={distance}
                      onChange={(e) => setDistance(Number(e.target.value))}
                      helperText="Meters"
                    />
                  </Box>
                </Popover>
              </Grid>
            </Grid>
          </Paper>
        </MapControl>
      )}
    </div>
  );
};

export default SpeakerPolygonsGroup;
