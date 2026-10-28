// Bulk upload's maps (server docs/032): pick a place for some rows, and see
// where everything will go before it's uploaded.
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import React, { useCallback, useState } from "react";
import { mapLibraries, mapsApiVersion } from "utils";

const useMaps = () =>
  useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

export interface Place {
  lat: number;
  lng: number;
}

/** Click the map to choose a place for the chosen rows. */
export const PickOnMap: React.FC<{
  open: boolean;
  start: Place;
  count: number;
  onClose: () => void;
  onPick: (p: Place) => void;
}> = ({ open, start, count, onClose, onPick }) => {
  const { isLoaded } = useMaps();
  const [place, setPlace] = useState<Place | null>(null);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Choose a place for {count === 1 ? "1 row" : `${count} rows`}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Click the map where {count === 1 ? "it was" : "they were"} recorded.
        </Typography>
        <Box sx={{ height: 420 }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={start}
              zoom={14}
              options={{ streetViewControl: false, mapTypeControl: false, clickableIcons: false }}
              onClick={(e) => e.latLng && setPlace({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
            >
              {place && <MarkerF position={place} />}
            </GoogleMap>
          ) : (
            <CircularProgress />
          )}
        </Box>
        <Typography variant="body2" sx={{ mt: 1, minHeight: 20 }}>
          {place ? `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}` : ""}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!place} onClick={() => place && onPick(place)}>
          Use this place
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Where the checked rows will go. */
export const ReviewMap: React.FC<{ points: (Place & { label: string })[]; fallback: Place }> = ({
  points,
  fallback,
}) => {
  const { isLoaded } = useMaps();
  const fit = useCallback(
    (map: google.maps.Map) => {
      if (!points.length) return;
      const b = new google.maps.LatLngBounds();
      points.forEach((p) => b.extend(p));
      map.fitBounds(b, 40);
      if (points.length === 1) map.setZoom(15);
    },
    [points]
  );
  if (!isLoaded) return <CircularProgress />;
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={points[0] ?? fallback}
      zoom={13}
      onLoad={fit}
      options={{ streetViewControl: false, mapTypeControl: false, clickableIcons: false }}
    >
      {points.map((p, i) => (
        <MarkerF key={i} position={p} title={p.label} />
      ))}
    </GoogleMap>
  );
};
