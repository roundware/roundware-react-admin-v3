import { History, Save } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Alert,
    Button,
    LinearProgress,
    Paper,
    Slide,
    Stack,
} from "@mui/material";
import {
    GoogleMap,
    useGoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import MapControl from "components/common/MapControl";
import {
    AssetMapContextProvider,
    useAssetMapContext,
} from "context/AssetMapContext";
import { useMarkerClusterer } from "hooks/useMarkerClusterer";
import React, { useEffect } from "react";
import { useListController } from "react-admin";
import { IAsset } from "types/asset";
import { mapLibraries } from "../../utils.tsx";
import AssetMarker from "./AssetMarker";

const AssetMarkers = () => {
  const { data, ...lc } = useListController();
  const map = useGoogleMap();
  const clusterer = useMarkerClusterer(map, { maxZoom: 16, minimumClusterSize: 3 });

  const { promises, handleSave, saving, setPromises } = useAssetMapContext();
  if (!data) return <LinearProgress />;

  return (
    <>
      <MapControl position={google.maps.ControlPosition.TOP_CENTER}>
        <Stack direction="row" spacing={1} my={1}>
          <Paper>
            <Alert severity={promises.length ? `info` : `success`}>
              {promises.length ? `${promises.length} Updates` : `Up to Date`}
            </Alert>
          </Paper>
          <Slide in={!!promises.length}>
            <LoadingButton
              variant="contained"
              color="primary"
              loading={saving.value}
              onClick={handleSave}
              startIcon={<Save />}
            >
              Save
            </LoadingButton>
          </Slide>
          <Slide in={!!promises.length}>
            <Button
              onClick={() => {
                setPromises([]);
                lc.refetch();
              }}
            >
              <History />
            </Button>
          </Slide>
        </Stack>
      </MapControl>
      {data.map((asset: IAsset) => (
        <AssetMarker key={asset.id} asset={asset} clusterer={clusterer} />
      ))}
    </>
  );
};

const GoogleMapsWrapper = (props: { children: React.ReactNode }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });
  const { data, total, setPerPage } = useListController();
  useEffect(() => {
    if (data && data.length != total) setPerPage(total);
  }, [total]);


  if (!isLoaded || !data || data.length != total) return <LinearProgress />;
  if (loadError) return <Alert severity="error">{loadError.message}</Alert>;
  return (
    <GoogleMap
      onLoad={(map) => {
        const bounds = new window.google.maps.LatLngBounds(
          {
            lat: Math.min(...data.map((a) => a.latitude)) - 1,
            lng: Math.min(...data.map((a) => a.longitude)) - 1,
          },
          {
            lat: Math.max(...data.map((a) => a.latitude)) + 1,
            lng: Math.max(...data.map((a) => a.longitude)) + 1,
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
      <AssetMapContextProvider>{props.children}</AssetMapContextProvider>
    </GoogleMap>
  );
};

const AssetMap = () => {
  return (
    <GoogleMapsWrapper>
      <AssetMarkers />
    </GoogleMapsWrapper>
  );
};
export default AssetMap;
