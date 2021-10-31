import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { useSpeakers } from "providers/SpeakersContext";
import LocationOnOutlinedIcon from "@material-ui/icons/LocationOnOutlined";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  DrawingManager,
  PolygonProps,
} from "@react-google-maps/api";
import { getGoogleMapsCenter } from "utilities";
import centerOfMass from "@turf/center-of-mass";
import { getCoord } from "@turf/invariant";
import SpeakerPolygonGroup from "./SpeakerPolygon";

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
  const { selectedSpeaker, speakers } = useSpeakers();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "drawing"],
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  // on load set the center
  // as center of boundry box of all the polygons of speakers
  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      const bounds = new window.google.maps.LatLngBounds();
      map.fitBounds(bounds);
      map.setOptions({
        center: getGoogleMapsCenter(speakers?.filter((s) => s?.shape) || []),
        zoom: 20,
      });
    },
    [speakers]
  );

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onLoadPolygon = (polygon: google.maps.Polygon) => {
    console.log("polygon: ", polygon);
  };

  // `selectedSpeaker` is just an id,
  // full data by finding the speaker
  const selectedSpeakerData = React.useMemo(() => {
    return speakers?.find((s) => s.id == selectedSpeaker);
  }, [selectedSpeaker, speakers]);

  // every time a speaker is selected pan the map to it
  useEffect(() => {
    if (selectedSpeakerData?.shape) {
      const center = centerOfMass(selectedSpeakerData?.shape);
      const [lat, lng] = getCoord(center);
      map?.panTo(new window.google.maps.LatLng(lng, lng));
      map?.setZoom(8);
    }
  }, [selectedSpeaker]);

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
                `Selected Speaker #${selectedSpeaker}`
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
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {/* show a drawing manager only when there no shape, */}
                {selectedSpeaker && !selectedSpeakerData?.shape && (
                  <DrawingManager />
                )}
                {/* all other polygons */}
                {speakers
                  ?.filter((s) => s.shape)
                  ?.map((s, index) => (
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

const paths = [
  { lat: 25.774, lng: -80.19 },
  { lat: 18.466, lng: -66.118 },
  { lat: 32.321, lng: -64.757 },
  { lat: 25.774, lng: -80.19 },
];
