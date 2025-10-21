import BlurCircularIcon from "@mui/icons-material/BlurCircular";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import SaveIcon from "@mui/icons-material/Save";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import {
    Box,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Popover,
    TextField,
    Tooltip,
} from "@mui/material";
import {
    Polygon,
    PolygonProps,
    Polyline,
    useGoogleMap,
} from "@react-google-maps/api";
import buffer from "@turf/buffer";
import { multiPolygon } from "@turf/helpers";
import MapControl from "components/common/MapControl";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { useSpeakers } from "context/SpeakersContext";
import useDebounce from "hooks/useDebounce";
import React, { useEffect, useMemo, useState } from "react";
import { useNotify } from "react-admin";
import { ISpeaker } from "types/speaker";
import {
    getSpeakerGeoJSONObjectsForPath,
    googleMapPathToGeoJSONPath,
    polygonToGoogleMapPaths,
} from "utilities";
interface Props {
  speaker: ISpeaker;
}
/**
 * this will render all the necesarry polygons for an individual speaker
 */
const SpeakerPolygonsGroup = ({ speaker }: Props): JSX.Element => {
  const {
    selectedSpeaker,
    fetchData,
    setSelectedSpeaker,
    setSpeakers,
    setIsCurrentSpeakerSaved,
  } = useSpeakers();
  const isSelected = selectedSpeaker == speaker.id;
  const map = useGoogleMap();
  const [shape, setShape] = useState(speaker.shape);

  const [distance, setDistance] = useState(
    Number(speaker.attenuation_distance)
  );
  const [lastValidDistance, setLastValidDistance] = useState<number | null>(null);
  const [hasUserChangedDistance, setHasUserChangedDistance] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    if (speaker.attenuation_distance)
      setDistance(Number(speaker.attenuation_distance));
    if (speaker.shape) setShape(speaker.shape);
    setHasUserChangedDistance(false); // Reset user change flag when speaker changes
  }, [speaker]);

  // Initialize lastValidDistance when speaker changes or distance is first available
  useEffect(() => {
    if (distance !== undefined && distance !== null) {
      setLastValidDistance(distance);
    }
  }, [speaker?.id, distance]);

  const dataProvider = useRoundwareDataProvider();

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
  
  // Calculate maximum valid attenuation distance based on shape size
  const calculateMaxValidDistance = (shape: any): number => {
    if (!shape || !shape.coordinates) return 0;
    
    try {
      // Get the bounding box of the shape
      const coords = shape.coordinates[0][0]; // First ring of first polygon
      let minLat = coords[0][1], maxLat = coords[0][1];
      let minLng = coords[0][0], maxLng = coords[0][0];
      
      coords.forEach((coord: [number, number]) => {
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
      });
      
      // Calculate approximate shape dimensions in meters
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      
      // Rough conversion to meters (1 degree ≈ 111km)
      const latMeters = latDiff * 111000;
      const lngMeters = lngDiff * 111000 * Math.cos((minLat + maxLat) * Math.PI / 360);
      
      // Use the smaller dimension as the maximum valid distance
      const maxDimension = Math.min(latMeters, lngMeters);
      
      // Return 80% of the smaller dimension to be safe
      return maxDimension * 0.8;
    } catch (e) {
      console.error('Error calculating max distance:', e);
      return 0;
    }
  };

  // the inner border, should not be editable
  const attenuationBorderPath: google.maps.LatLng[] | null = useMemo(() => {
    if (!shape) return null;
    
    // Don't calculate if distance is 0 or undefined
    if (distance === 0 || distance === undefined || distance === null) {
      return null;
    }
    
    let polygon;
    try {
      polygon = buffer(shape, -distance, {
        units: "meters",
      });
      
      // If successful, update the last valid distance
      if (polygon && (lastValidDistance === null || distance !== lastValidDistance)) {
        setLastValidDistance(distance);
      }
    } catch (e) {
      console.error('Attenuation border calculation error:', e);
      
      // Only show error and reset if this is a user-initiated change (not initial load)
      if (hasUserChangedDistance && lastValidDistance !== null && lastValidDistance !== distance) {
        notify(`Error calculating attenuation border: ${e?.message || 'Unknown error'}. Resetting to previous value.`, { type: 'error' });
        setDistance(lastValidDistance);
        return null; // Will recalculate with valid distance
      }
    }

    /** just use previous shape as something goes wrong */
    if (!polygon) return null;
    return polygonToGoogleMapPaths(polygon.geometry);
  }, [shape, debouncedDistance, speaker, distance, lastValidDistance, notify, setDistance, hasUserChangedDistance]);

  // Separate validation effect that runs when user changes distance
  useEffect(() => {
    if (lastValidDistance === null || !hasUserChangedDistance || !shape) return;
    
    // Don't validate if the distance matches the last valid distance (already validated)
    if (lastValidDistance !== null && distance === lastValidDistance) {
      return;
    }
    
    // Check if distance is too large for the shape
    const maxValidDistance = calculateMaxValidDistance(shape);
    if (distance > maxValidDistance && maxValidDistance > 0) {
      notify(`Attenuation distance (${distance}m) is too large for this shape. Maximum allowed: ${Math.round(maxValidDistance)}m. Resetting to previous value.`, { type: 'error' });
      // Reset to last valid distance if available, otherwise use a safe default
      const resetValue = lastValidDistance !== null ? lastValidDistance : Math.round(maxValidDistance * 0.5);
      setDistance(resetValue);
    }
  }, [distance, hasUserChangedDistance, shape, lastValidDistance, notify, setDistance]);

  const shapePath = useMemo(() => {
    return polygonToGoogleMapPaths(shape);
  }, [shape, speaker]);

  const [dragging, setDragging] = useState(false);

  const handleDragStart = () => setDragging(true);
  const updatePolygon = (e: google.maps.MapMouseEvent) => {
    if (e) console.info(`Polygon edited`);
    // Only mark as unsaved if we were actually dragging (editing the shape)
    if (dragging) {
      setIsCurrentSpeakerSaved(false);
    }
    setDragging(false);
    const newPath = polygon?.getPath().getArray();

    if (Array.isArray(newPath)) {
      const newMultiPolygon = multiPolygon([
        [googleMapPathToGeoJSONPath(newPath)],
      ]).geometry;
      setShape(newMultiPolygon);
    }
  };
  const [polygon, setPolygon] = useState<google.maps.Polygon>();
  const handleOnPolygonLoad = (loadedPolygon: google.maps.Polygon) =>
    setPolygon(loadedPolygon);

  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    setSaving(true);
    
    try {
      const geoJSONObjects = getSpeakerGeoJSONObjectsForPath(
        googleMapPathToGeoJSONPath(shapePath),
        distance
      );
      
      dataProvider
        .update(`speakers`, {
          id: speaker.id,
          data: {
            ...speaker,
            ...geoJSONObjects,
            attenuation_distance: distance,
          },
          previousData: {
            ...speaker,
          },
        })
        .then(() => {
          fetchData();
          setIsCurrentSpeakerSaved(true);
          setHasUserChangedDistance(false); // Reset user change flag after successful save
        })
        .catch((error) => {
          console.error('Error saving speaker:', error);
          notify(`Error saving speaker: ${error.message}`, { type: 'error' });
        })
        .finally(() => setSaving(false));
    } catch (error) {
      console.error('Error processing speaker data:', error);
      notify(`Error processing speaker data: ${error.message}`, { type: 'error' });
      setSaving(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (
      isSelected &&
      polygon &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typeof polygon?.getBounds == "function" &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      polygon.getBounds()
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      map?.fitBounds(polygon.getBounds());
    } else {
      handleDiscard();
    }
  }, [isSelected, polygon, speaker]);

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

  const handleDiscard = () => {
    setShape(speaker.shape);
    setIsCurrentSpeakerSaved(true);
  };

  const handleDelete = () => {
    const confirmation = window.confirm(
      `Deleting a speaker will only allow you to draw a new shape`
    );

    if (confirmation) {
      setSpeakers((s) => {
        setIsCurrentSpeakerSaved(false);
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

  const handleClick = () => {
    if (selectedSpeaker != speaker.id) {
      setSelectedSpeaker(speaker.id);
    }
  };

  // Rotation functions
  const rotatePolygon = (angle: number) => {
    if (!shapePath || !Array.isArray(shapePath)) return;
    
    // Calculate center of polygon
    const center = {
      lat: shapePath.reduce((sum, point) => sum + point.lat(), 0) / shapePath.length,
      lng: shapePath.reduce((sum, point) => sum + point.lng(), 0) / shapePath.length,
    };
    
    // Account for latitude scaling - longitude lines get closer together at higher latitudes
    const latScale = Math.cos((center.lat * Math.PI) / 180);
    
    const rotatedPath = shapePath.map(point => {
      // Convert to relative coordinates
      const lat = point.lat() - center.lat;
      const lng = (point.lng() - center.lng) * latScale; // Scale longitude by latitude
      
      // Apply rotation matrix
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      // Rotate around center
      const newLat = lat * cos - lng * sin;
      const newLng = (lat * sin + lng * cos) / latScale; // Unscale longitude
      
      return new google.maps.LatLng(
        newLat + center.lat,
        newLng + center.lng
      );
    });
    
    // Convert back to GeoJSON format and update the shape
    const rotatedGeoJSON = multiPolygon([
      [googleMapPathToGeoJSONPath(rotatedPath)]
    ]).geometry;
    
    setShape(rotatedGeoJSON);
    setIsCurrentSpeakerSaved(false);
  };

  const handleRotateLeft = () => rotatePolygon(-5); // Rotate 5 degrees counter-clockwise
  const handleRotateRight = () => rotatePolygon(5); // Rotate 5 degrees clockwise

  // Scaling functions
  const scalePolygon = (scaleFactor: number) => {
    if (!shapePath || !Array.isArray(shapePath)) return;
    
    // Calculate center of polygon
    const center = {
      lat: shapePath.reduce((sum, point) => sum + point.lat(), 0) / shapePath.length,
      lng: shapePath.reduce((sum, point) => sum + point.lng(), 0) / shapePath.length,
    };
    
    // Account for latitude scaling - longitude lines get closer together at higher latitudes
    const latScale = Math.cos((center.lat * Math.PI) / 180);
    
    const scaledPath = shapePath.map(point => {
      // Convert to relative coordinates
      const lat = point.lat() - center.lat;
      const lng = (point.lng() - center.lng) * latScale; // Scale longitude by latitude
      
      // Apply scaling
      const newLat = lat * scaleFactor;
      const newLng = lng * scaleFactor;
      
      return new google.maps.LatLng(
        newLat + center.lat,
        (newLng / latScale) + center.lng // Unscale longitude
      );
    });
    
    // Convert back to GeoJSON format and update the shape
    const scaledGeoJSON = multiPolygon([
      [googleMapPathToGeoJSONPath(scaledPath)]
    ]).geometry;
    
    setShape(scaledGeoJSON);
    setIsCurrentSpeakerSaved(false);
  };

  const handleScaleUp = () => scalePolygon(1.1); // Scale up by 10%
  const handleScaleDown = () => scalePolygon(0.9); // Scale down by 10%

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
        onClick={handleClick}
        onDblClick={handleDblClick}
        options={shapePolygonOptions}
      />

      {attenuationBorderPath && (
        <Polygon
          paths={attenuationBorderPath}
          onClick={handleClick}
          options={attenuationBorderOptions}
          visible={!dragging}
        />
      )}

      {isSelected && (
        <MapControl position={window.google.maps.ControlPosition.LEFT_CENTER}>
          <Paper>
            <Grid direction="column" spacing={1}>
              <Grid item>
                <Tooltip title="Save Changes" placement="right">
                  <IconButton
                    onClick={handleSave}
                    disabled={saving}
                    size="large"
                  >
                    {saving ? <CircularProgress /> : <SaveIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Discard Changes" placement="right">
                  <IconButton onClick={handleDiscard} size="large">
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Delete Shape" placement="right">
                  <IconButton onClick={handleDelete} size="large">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Rotate Left (5°)" placement="right">
                  <IconButton onClick={handleRotateLeft} size="large">
                    <RotateLeftIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Rotate Right (5°)" placement="right">
                  <IconButton onClick={handleRotateRight} size="large">
                    <RotateRightIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Scale Up (10%)" placement="right">
                  <IconButton onClick={handleScaleUp} size="large">
                    <ZoomOutMapIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Scale Down (10%)" placement="right">
                  <IconButton onClick={handleScaleDown} size="large">
                    <ZoomInMapIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Attenuation Distance" placement="right">
                  <IconButton onClick={handleOpenAD} size="large">
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
                      inputProps={{
                        min: 0,
                        step: 1
                      }}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        // Only allow positive integers including 0
                        if (value >= 0 && Number.isInteger(value)) {
                          setDistance(value);
                          setHasUserChangedDistance(true);
                        }
                      }}
                      helperText="Meters (positive integers only)"
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
