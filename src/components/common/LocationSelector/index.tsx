import useFieldValue from "hooks/useFieldValue";
import React from "react";
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import PlacesAutoComplete from "./PlacesAutoComplete";

interface Props {
  fieldNames: {
    latitude: string;
    longitude: string;
  };
}

const containerStyle = {
  width: "400px",
  height: "400px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const LocationSelector = (props: Props) => {
  const [lat, setLat] = useFieldValue(props.fieldNames.latitude);
  const [lng, setLng] = useFieldValue(props.fieldNames.longitude);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleOnLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container direction="column">
          <Grid container item xs={12} alignItems="center">
            <Grid item>
              <LocationOnIcon />
            </Grid>
            <Grid item>
              <Typography variant="h6">Location Coordinates</Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              {lat && lng ? `${lat}, ${lng}` : `No Location Selected`}
            </Typography>
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
                      center={center}
                      zoom={10}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                    >
                      {/* Child components, such as markers, info windows, etc. */}
                      <></>
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
