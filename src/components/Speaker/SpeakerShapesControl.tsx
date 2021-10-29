import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { useSpeakers } from "providers/SpeakersContext";
import LocationOnOutlinedIcon from "@material-ui/icons/LocationOnOutlined";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
const containerStyle = {
  width: "100%",
  height: "60vh",
};

const center = {
  lat: 34.0479,
  lng: 100.6197,
};
interface Props {}
/**
 * shows / edit / create any shapes of type ISpeakerShape
 *
 */
const SpeakerShapesControl = (props: Props) => {
  const { selectedSpeaker } = useSpeakers();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return (
    <Card>
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Typography variant="h4">Map</Typography>
            <Typography
              variant="h6"
              style={{ fontWeight: selectedSpeaker ? "bold" : "normal" }}
            >
              {selectedSpeaker ? (
                `Edit Speaker #${selectedSpeaker}`
              ) : (
                <Grid container direction="row" alignItems="center">
                  Select a Speaker to Edit using{" "}
                  <LocationOnOutlinedIcon fontSize={"medium"} /> Icon from List
                </Grid>
              )}
            </Typography>
          </Grid>
          <Grid item>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
              ></GoogleMap>
            ) : (
              <CircularProgress />
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SpeakerShapesControl;
