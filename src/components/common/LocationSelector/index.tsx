import useFieldValue from "hooks/useFieldValue";
import React from "react";
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import PlacesAutoComplete from "./PlacesAutoComplete";
import SelectorPin from "./SelectorPin";
interface Props {
  fieldNames: {
    latitude: string;
    longitude: string;
  };
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const LocationSelector = (props: Props): JSX.Element => {
  const [latStr, setLat] = useFieldValue(props.fieldNames.latitude);
  const [lngStr, setLng] = useFieldValue(props.fieldNames.longitude);

  const lat = Number(latStr) || 0;
  const lng = Number(lngStr) || 0;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "drawing"],
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
    setLat(newLat);
    setLng(newLng);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid container item xs={12} alignItems="center">
            <Grid item>
              <LocationOnIcon />
            </Grid>
            <Grid item>
              <Typography variant="h6">Location Coordinates</Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            {lat && lng ? (
              <div>
                <TextField
                  value={lat}
                  label="Latitude"
                  onChange={(e) => setLat(Number(e.target.value))}
                />
                <TextField
                  value={lng}
                  label="Longitude"
                  onChange={(e) => setLng(Number(e.target.value))}
                />
              </div>
            ) : (
              `No Location Selected`
            )}
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

                      // onUnmount={onUnmount}
                    >
                      <SelectorPin
                        onChange={handleOnLocationChange}
                        lat={Number(lat) || 0}
                        lng={Number(lng) || 0}
                      />
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
