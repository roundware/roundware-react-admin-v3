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
    MarkerClusterer,
    useGoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
import MapControl from "components/common/MapControl";
import {
    AssetMapContextProvider,
    useAssetMapContext,
} from "context/AssetMapContext";
import React, { Fragment, useEffect, useState } from "react";
import { useListController } from "react-admin";
import { OverlappingMarkerSpiderfier } from "ts-overlapping-marker-spiderfier";
import { IAsset } from "types/asset";
import { mapLibraries } from "../../utils.tsx";
import AssetMarker from "./AssetMarker";

const AssetMarkers = () => {
  const { data, ...lc } = useListController();

  const [markerClusterer, setMarkerClusterer] = useState<Clusterer | null>(
    null
  );

  const markers = (clusterer: Clusterer) => {
    const childrenRenderer = (oms: OverlappingMarkerSpiderfier | null) =>
      oms
        ? data.map((asset: IAsset) => (
            <AssetMarker
              key={asset.id}
              asset={asset}
              clusterer={clusterer}
              oms={oms}
            />
          ))
        : [];
    return (
      <OverlappingMarkerSpiderfierComponent>
        {childrenRenderer}
      </OverlappingMarkerSpiderfierComponent>
    );
  };
  const recluster = () => {
    if (markerClusterer) {
      const markerObjs = markerClusterer.markers.slice();
      markerClusterer.clearMarkers();
      markerClusterer.repaint();
      markerClusterer.addMarkers(markerObjs, false);
    }
  };

  const options = {
    imagePath:
      "https://github.com/googlemaps/v3-utility-library/raw/master/packages/markerclustererplus/images/m",
  };

  const wait_for_full_page = async () => {
    return new Promise<void>((resolve, reject) => {
      const checkStart = Date.now();
      const checkLength = () => {
        if (markerClusterer && data.length >= markerClusterer.markers.length) {
          resolve();
        } else if (Date.now() > checkStart + 3000) {
          reject(
            "asset page contains a different number of entries than the marker clusterer"
          );
        } else {
          setTimeout(checkLength, 100);
        }
      };
      checkLength();
    });
  };
  useEffect(() => {
    if (!(markerClusterer && markerClusterer.ready)) return;
    wait_for_full_page().then(recluster);
  }, [markerClusterer && markerClusterer.ready, data]);

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
      <MarkerClusterer
        maxZoom={16}
        onLoad={setMarkerClusterer}
        minimumClusterSize={3}
        options={options}
      >
        {markers}
      </MarkerClusterer>
    </>
  );
};
const OverlappingMarkerSpiderfierComponent = (props: {
  children: (props: OverlappingMarkerSpiderfier | null) => React.ReactNode;
}) => {
  const map = useGoogleMap();
  const [spiderfier, set_spiderfier] =
    useState<OverlappingMarkerSpiderfier | null>(null);

  useEffect(() => {
    if (!spiderfier && map) {
      const oms_obj = new OverlappingMarkerSpiderfier(map, {
        markersWontMove: true,
        markersWontHide: true,
        basicFormatEvents: true,
      });
      set_spiderfier(oms_obj);
    }
  }, [spiderfier, map]);

  if (!map || !spiderfier) {
    return null;
  }

  return <Fragment>{props.children(spiderfier)}</Fragment>;
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
    if (data.length != total) setPerPage(total);
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
