import {
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useSpeakers } from "providers/SpeakersContext";
import React from "react";
import SpeakerDrawer from "./SpeakerDrawer";
import SpeakerPolygonGroup from "./SpeakerPolygon";
import { mapLibraries } from "utils";
const containerStyle = {
  width: "100%",
  height: "60vh",
};

// const center = {
//   lat: 34.0479,
//   lng: 100.6197,
// };

/**
 * shows / edit / create any shapes of type ISpeakerShape
 *
 */
const SpeakerShapesControl = (): JSX.Element => {
  const { selectedSpeaker, speakers } = useSpeakers();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const [, setMap] = React.useState<google.maps.Map | null>(null);

  // on load set the center
  // as center of boundry box of all the polygons of speakers
  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      google.maps.Polygon.prototype.getBounds = function () {
        const bounds = new google.maps.LatLngBounds();
        this.getPaths().forEach((p) => {
          p.forEach((element: google.maps.LatLng) => bounds.extend(element));
        });
        return bounds;
      };
      setMap(map);
      const bounds = new window.google.maps.LatLngBounds();
      map.fitBounds(bounds);
      map.panTo(new google.maps.LatLng(0, 0));
      map.setZoom(1);
      // map.setOptions({
      //   center: getGoogleMapsCenter(speakers?.filter((s) => s?.shape) || []),
      //   zoom: 1,
      // });
    },
    [speakers]
  );

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  return (
    <Card variant="outlined" style={{ margin: 16 }}>
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Typography variant="h5">Shapes</Typography>
            <Typography
              variant="body1"
              style={{ fontWeight: selectedSpeaker ? "bold" : "normal" }}
            >
              {selectedSpeaker ? (
                `Selected Speaker #${selectedSpeaker}`
              ) : (
                <Grid container direction="row" alignItems="center">
                  Select a Speaker to Edit using{" "}
                  <LocationOnOutlinedIcon fontSize={"medium"} /> Icon from List,
                  Or Double Click any shape
                </Grid>
              )}
            </Typography>
          </Grid>
          <Grid item>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {/* show a drawing manager only when there no shape, */}
                <SpeakerDrawer />
                {/* all other polygons */}
                {speakers
                  ?.filter((s) => s.shape)
                  ?.map((s) => (
                    <SpeakerPolygonGroup speaker={s} key={s.id} />
                  ))}
              </GoogleMap>
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

// const paths = [
//   { lat: 25.774, lng: -80.19 },
//   { lat: 18.466, lng: -66.118 },
//   { lat: 32.321, lng: -64.757 },
//   { lat: 25.774, lng: -80.19 },
// ];
