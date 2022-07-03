import { Alert, Box, LinearProgress } from "@mui/material";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import {
  SessionMapContextProvider,
  useSesisonMap,
} from "context/SessionMapContext";
import React, { forwardRef } from "react";
import { mapLibraries } from "utils";
import SessionMapFilters from "./SessionMapFilters";
import SessionMapMarkers from "./SessionMapMarkers";

const SessionMap = () => {
  return (
    <SessionMapContextProvider>
      <Box my={5}>
        <SessionMapFilters />
        <GoogleMapsWrapper>
          <SessionMapMarkers />
        </GoogleMapsWrapper>
      </Box>
    </SessionMapContextProvider>
  );
};

const GoogleMapsWrapper = (props: { children: React.ReactNode }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const { events } = useSesisonMap();
  if (!isLoaded) return <LinearProgress />;
  if (loadError) return <Alert severity="error">{loadError.message}</Alert>;

  return (
    <GoogleMap
      onLoad={(map) => {
        const bounds = new window.google.maps.LatLngBounds(
          {
            lat: Math.min(...events.map((a) => a.latitude)) - 1,
            lng: Math.min(...events.map((a) => a.longitude)) - 1,
          },
          {
            lat: Math.max(...events.map((a) => a.latitude)) + 1,
            lng: Math.max(...events.map((a) => a.longitude)) + 1,
          }
        );
        map.fitBounds(bounds);
        map.setZoom(10);
      }}
      mapContainerStyle={{
        height: "calc(100vh - 48px - 48px - 64px)",
        width: "100%",
      }}
    >
      <>{props.children}</>
    </GoogleMap>
  );
};

export default SessionMap;
