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
} from "@react-google-maps/api";
import { getGoogleMapsCenter } from "utilities";
import centerOfMass from "@turf/center-of-mass";
import { getCoord } from "@turf/invariant";
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

  // 1. make editable only the speaker which is selected
  // 2. show a save button whenever changes are made, i.e
  //    whenever any speaker is modified we add `updated` property as `true`
  const googleMapPolygons = useMemo(() => {
    if (!isLoaded) return [];
    return (
      speakers
        ?.filter((s) => s?.shape)
        .map((s) => {
          const isSelected = s?.id == selectedSpeaker;

          return {
            // get the first polygon
            // even though it is a multipolygon type we currently store only a single polygon
            paths: s.shape.coordinates[0][0]?.map(
              (p) => new window.google.maps.LatLng(p[1], p[0])
            ),
            options: {
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
            },
          };
        }) || []
    );
  }, [selectedSpeaker, speakers, isLoaded]);

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
                {googleMapPolygons?.map((p) => (
                  <Polygon
                    onLoad={onLoadPolygon}
                    paths={p.paths}
                    options={p.options}
                  />
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
