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
import { mapLibraries } from "utils";
import PlacesAutoComplete from "./PlacesAutoComplete";
import SelectorPin from "./SelectorPin";
interface Props {
  fieldNames: {
    latitude: string;
    longitude: string;
  };
  /** Optional element rendered inline to the right of the lat/lon fields. */
  headerAction?: React.ReactNode;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const LocationSelector = (props: PropsWithChildren<Props>): JSX.Element => {
  const [latValue, setLatValue] = useFieldValue<number>(
    props.fieldNames.latitude,
    0
  );
  const [lngValue, setLngValue] = useFieldValue<number>(
    props.fieldNames.longitude,
    0
  );

  const [latStr, setLatStr] = useState(latValue.toString());
  const [lngStr, setLngStr] = useState(lngValue.toString());

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    map.setCenter({
      lat,
      lng,
    });
    map.panTo({
      lat,
      lng,
    });
    map.setZoom(16);
  }, []);

  // const onUnmount = React.useCallback(function callback() {}, []);

  const handleOnLocationChange = (newLat: number, newLng: number) => {
    setLatStr(newLat.toString());
    setLngStr(newLng.toString());
  };

  useEffect(() => {
    if (parseFloat(latStr) != latValue) setLatValue(parseFloat(latStr));
    if (parseFloat(lngStr) != lngValue) setLngValue(parseFloat(lngStr));
  }, [latStr, lngStr]);

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid container item xs={12} alignItems="center">
            <Grid item>
              <LocationOnIcon />
            </Grid>
            <Grid item>
              <Typography variant="h6">Location</Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1} direction="row" alignItems="center">
              <TextField
                value={latStr}
                label="Latitude"
                onChange={(e) => setLatStr(e.target.value)}
              />
              <TextField
                value={lngStr}
                label="Longitude"
                onChange={(e) => setLngStr(e.target.value)}
              />
              {props.headerAction}
            </Stack>
          </Grid>
          <Grid item>
            {isLoaded ? (
              <>
                <Grid container spacing={2} direction="column">
                  <Grid item>
                    <PlacesAutoComplete onSelect={handleOnLocationChange} />
                  </Grid>
                  <Grid item>
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      onLoad={onLoad}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: true,
                      }}
                    >
                      <SelectorPin
                        onChange={handleOnLocationChange}
                        lat={lat || 0}
                        lng={lng || 0}
                      />
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
