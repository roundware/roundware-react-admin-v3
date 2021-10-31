import React, { useMemo, useState, useEffect } from "react";
import { ISpeaker } from "types/speaker";
import {
  Polygon,
  PolygonProps,
  InfoWindow,
  useGoogleMap,
} from "@react-google-maps/api";
import {
  Toolbar,
  Tooltip,
  IconButton,
  Button,
  Paper,
  Grid,
} from "@material-ui/core";
import { polygonToGoogleMapPaths } from "utilities";
import DeleteIcon from "@material-ui/icons/Delete";
import SaveIcon from "@material-ui/icons/Save";
import { useSpeakers } from "providers/SpeakersContext";
import buffer from "@turf/buffer";
import MapControl from "components/common/MapControl";
interface Props {
  speaker: ISpeaker;
}
/**
 * this will render all the necesarry polygons for an individual speaker
 */
const SpeakerPolygonsGroup = ({ speaker }: Props) => {
  const { selectedSpeaker } = useSpeakers();
  const isSelected = selectedSpeaker == speaker.id;
  const map = useGoogleMap();
  const [shape, setShape] = useState(speaker.shape);
  const [distance, setDistance] = useState(speaker.attenuation_distance);
  // the outer shape
  const shapePolygonOptions: PolygonProps[`options`] = {
    fillColor: "lightblue",
    fillOpacity: 1,
    strokeColor: "red",
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: true,
    draggable: isSelected,
    editable: isSelected,
    geodesic: false,
    zIndex: 1,
  };

  const attenuationBorderOptions = {
    fillOpacity: 0,
    strokeColor: "#00000050",
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

  return (
    <div>
      <Polygon paths={shapePath} options={shapePolygonOptions} />
      <Polygon
        paths={attenuationBorderPath}
        options={attenuationBorderOptions}
      />

      {isSelected && (
        <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
          <Paper>
            <Grid direction="column" spacing={1}>
              <Grid item>
                <Tooltip title="Save Changes" placement="right">
                  <IconButton>
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Discard Changes" placement="right">
                  <IconButton>
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
