import { Marker } from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
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

  return (
    <Marker
      position={position}
      clusterer={clusterer}
      onLoad={(m) => oms.addMarker(m, () => {})}
      noClustererRedraw={true}
    >
      {/* <AssetInfoWindow asset={asset} /> */}
    </Marker>
  );
};

export default React.memo(AssetMarker);
