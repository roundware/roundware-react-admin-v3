import { Marker } from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
import { useAssetMapContext } from "context/AssetMapContext";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import React, { useEffect, useMemo } from "react";

import { OverlappingMarkerSpiderfier } from "ts-overlapping-marker-spiderfier";
import { IAsset } from "types/asset";

interface AssetMarkerProps {
  asset: IAsset;
  clusterer: Clusterer;
  oms: OverlappingMarkerSpiderfier;
}
const AssetMarker = ({ asset, clusterer, oms }: AssetMarkerProps) => {
  const position = { lat: asset.latitude!, lng: asset.longitude! };
  const { setPromises } = useAssetMapContext();
  const dataProvider = useRoundwareDataProvider();
  return (
    <Marker
      position={position}
      clusterer={clusterer}
      onLoad={(m) => oms.addMarker(m, () => {})}
      noClustererRedraw={true}
      draggable
      onDragEnd={(ev) => {
        const newLat = ev.latLng?.lat();
        const newLng = ev.latLng?.lng();
        if (newLat == asset.latitude && newLng == asset.longitude) return;
        setPromises((prev) => [
          ...prev.filter((p) => p.id != asset.id),
          {
            id: asset.id,
            promise: () =>
              dataProvider.update(`assets`, {
                id: asset.id,
                data: {
                  latitide: newLat!,
                  longitude: newLng!,
                },
                previousData: asset,
              }),
          },
        ]);
      }}
    >
      {/* <AssetInfoWindow asset={asset} /> */}
    </Marker>
  );
};

export default React.memo(AssetMarker);
