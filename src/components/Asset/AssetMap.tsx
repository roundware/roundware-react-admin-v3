import React, { Fragment, PropsWithChildren, useEffect, useState } from "react";
import useBoolean from "hooks/useBoolean";
import { useListController } from "react-admin";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerClusterer,
  useGoogleMap,
} from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
import { OverlappingMarkerSpiderfier } from "ts-overlapping-marker-spiderfier";
import { IAsset } from "types/asset";
import AssetMarker from "./AssetMarker";
import { mapLibraries } from "utils";
import { Alert, LinearProgress, Slide, Stack } from "@mui/material";
import {
  AssetMapContextProvider,
  useAssetMapContext,
} from "context/AssetMapContext";
import { LoadingButton } from "@mui/lab";
import MapControl from "components/common/MapControl";
import { Save } from "@mui/icons-material";

const AssetMarkers = () => {
  const { data, ...lc } = useListController();

  const [markerClusterer, setMarkerClusterer] = useState<Clusterer | null>(
    null
  );

  const markers = (clusterer: Clusterer) => {
    const childrenRenderer = (oms: OverlappingMarkerSpiderfier | null) =>
      data.map((asset: IAsset) => (
        <AssetMarker
          key={asset.id}
          asset={asset}
          clusterer={clusterer}
          oms={oms!}
        />
      ));
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
  useEffect(() => {
    lc.setPerPage(lc.total);
    return () => lc.setPerPage(10);
  }, [data]);

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

  const { promises, handleSave, saving } = useAssetMapContext();
  if (!data) return <LinearProgress />;

  return (
    <>
      <MapControl position={google.maps.ControlPosition.TOP_CENTER}>
        <Stack direction="row" spacing={1} my={1}>
          <Alert severity={promises.length ? `info` : `success`}>
            {promises.length ? `${promises.length} Updates` : `Up to Date`}
          </Alert>
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

const GoogleMapsWrapper = (props: PropsWithChildren<{}>) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });
  const { data } = useListController();

  if (!isLoaded || !data) return <LinearProgress />;
  if (loadError) return <Alert severity="error">{loadError.message}</Alert>;
  return (
    <GoogleMap
      onLoad={(map) => {
        const bounds = new window.google.maps.LatLngBounds();
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
