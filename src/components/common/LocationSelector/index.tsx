import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import useFieldValue from "hooks/useFieldValue";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { mapLibraries, mapsApiVersion } from "utils";
import PlacesAutoComplete from "./PlacesAutoComplete";
import SelectorPin from "./SelectorPin";
import { useProjects } from "context/ProjectsContext";
interface Props {
  fieldNames: {
    latitude: string;
    longitude: string;
  };
  /** Optional element rendered inline to the right of the lat/lon fields. */
  headerAction?: React.ReactNode;
  /** Shown but not editable, with this note under the fields: a moving
   *  asset's position is set by its mover (server docs/030). */
  readOnlyNote?: string;
  /** May have no location (a contribution): empty fields save as none.
   *  Without it (a project), an empty location starts at 0, 0. */
  allowEmpty?: boolean;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const LocationSelector = (props: PropsWithChildren<Props>): JSX.Element => {
  // A contribution may have no location (a text or photo uploaded without
  // one): the fields are then empty, and it crashed the page (2026-10-28).
  const empty = props.allowEmpty ? null : 0;
  const [latValue, setLatValue] = useFieldValue<number | null>(
    props.fieldNames.latitude,
    empty
  );
  const [lngValue, setLngValue] = useFieldValue<number | null>(
    props.fieldNames.longitude,
    empty
  );
  const { selectedProject } = useProjects();

  const [latStr, setLatStr] = useState(latValue == null ? "" : String(latValue));
  const [lngStr, setLngStr] = useState(lngValue == null ? "" : String(lngValue));

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const placed = Number.isFinite(lat) && Number.isFinite(lng);
  // Without a place, the map opens on the project.
  const center = placed
    ? { lat, lng }
    : { lat: selectedProject?.latitude ?? 0, lng: selectedProject?.longitude ?? 0 };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    map.setCenter(center);
    map.panTo(center);
    map.setZoom(placed ? 16 : 13);
  }, []);

  // const onUnmount = React.useCallback(function callback() {}, []);

  const handleOnLocationChange = (newLat: number, newLng: number) => {
    setLatStr(newLat.toString());
    setLngStr(newLng.toString());
  };

  // Empty fields mean no location (null), never NaN; a half-typed number
  // waits until it reads as one.
  useEffect(() => {
    const read = (s: string) => (s.trim() === "" ? empty : parseFloat(s));
    const a = read(latStr);
    const b = read(lngStr);
    if ((a === null || Number.isFinite(a)) && a !== latValue) setLatValue(a);
    if ((b === null || Number.isFinite(b)) && b !== lngValue) setLngValue(b);
  }, [latStr, lngStr]);

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid container size={{ xs: 12 }} alignItems="center">
            <Grid>
              <LocationOnIcon />
            </Grid>
            <Grid>
              <Typography variant="h6">Location</Typography>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack spacing={1} direction="row" alignItems="center">
              <TextField
                value={latStr}
                label="Latitude"
                onChange={(e) => setLatStr(e.target.value)}
                disabled={!!props.readOnlyNote}
              />
              <TextField
                value={lngStr}
                label="Longitude"
                onChange={(e) => setLngStr(e.target.value)}
                disabled={!!props.readOnlyNote}
              />
              {props.headerAction}
            </Stack>
            {props.readOnlyNote && (
              <Typography variant="caption" color="text.secondary">
                {props.readOnlyNote}
              </Typography>
            )}
          </Grid>
          <Grid>
            {isLoaded ? (
              <>
                <Grid container spacing={2} direction="column">
                  {!props.readOnlyNote && (
                    <Grid>
                      <PlacesAutoComplete onSelect={handleOnLocationChange} />
                    </Grid>
                  )}
                  <Grid>
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      onLoad={onLoad}
                      // With no place yet, a click sets one.
                      onClick={(e) =>
                        !props.readOnlyNote && !placed && e.latLng && handleOnLocationChange(e.latLng.lat(), e.latLng.lng())
                      }
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: true,
                      }}
                    >
                      {placed && (
                        <SelectorPin
                          onChange={handleOnLocationChange}
                          lat={lat}
                          lng={lng}
                          draggable={!props.readOnlyNote}
                        />
                      )}
                      {props.children || null}
                    </GoogleMap>
                  </Grid>
                </Grid>
              </>
            ) : (
              <CircularProgress />
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;
