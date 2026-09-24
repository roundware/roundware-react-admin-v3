// ---------------------------------------------------------------------------
// Standalone location selector for the wizard (no react-admin form context)
// Includes Google Places autocomplete + interactive map when Maps API is loaded
// ---------------------------------------------------------------------------
import React, { useCallback, useRef } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { useJsApiLoader } from "@react-google-maps/api";
import PlacesAutoComplete from "../../../components/common/LocationSelector/PlacesAutoComplete";
import { mapLibraries, mapsApiVersion } from "../../../utils";

interface WizardLocationSelectorProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

const WizardLocationSelector: React.FC<WizardLocationSelectorProps> = ({
  latitude,
  longitude,
  onChange,
}) => {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load the Maps script rather than waiting for someone else to. Nothing on
  // the wizard's project step draws a map, so the old "poll until `google` is
  // defined" check never resolved and the step silently degraded to two number
  // fields. The id/version/libraries match every other map in the admin, so
  // the loader dedupes instead of pulling in a second copy.
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    version: mapsApiVersion,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  // Handle Places autocomplete selection — update coords + pan map
  const handlePlaceSelect = useCallback(
    (lat: number, lng: number) => {
      onChange(lat, lng);
      if (mapInstanceRef.current) {
        const pos = { lat, lng };
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(14);
        markerRef.current?.setPosition(pos);
      }
    },
    [onChange]
  );

  const mapContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !mapsLoaded || mapInstanceRef.current) return;
      const map = new google.maps.Map(node, {
        center: { lat: latitude, lng: longitude },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });

      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        draggable: true,
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          onChange(e.latLng.lat(), e.latLng.lng());
        }
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          onChange(pos.lat(), pos.lng());
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    },
    // Initialize map once — only re-run when mapsLoaded changes
    [mapsLoaded]
  );

  return (
    <Box>
      {/* Places autocomplete search */}
      {mapsLoaded && (
        <Box sx={{ mb: 2 }}>
          <PlacesAutoComplete
            onSelect={handlePlaceSelect}
            label="Search for the project location"
            fullWidth
          />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Latitude"
            type="number"
            value={latitude}
            onChange={(e) =>
              onChange(parseFloat(e.target.value) || 0, longitude)
            }
            fullWidth
            size="small"
            inputProps={{ step: 0.0001 }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Longitude"
            type="number"
            value={longitude}
            onChange={(e) =>
              onChange(latitude, parseFloat(e.target.value) || 0)
            }
            fullWidth
            size="small"
            inputProps={{ step: 0.0001 }}
          />
        </Grid>
      </Grid>

      {mapsLoaded ? (
        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height: 300,
            mt: 2,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
          }}
        />
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Enter coordinates above, or configure Google Maps API key for
          interactive map selection.
        </Typography>
      )}
    </Box>
  );
};

export default WizardLocationSelector;
