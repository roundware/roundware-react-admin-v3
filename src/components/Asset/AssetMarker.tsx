import { red } from "@mui/material/colors";
import { Marker } from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
import { useAssetMapContext } from "context/AssetMapContext";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { clone, isEqual } from "lodash";
import React, { useMemo, useState } from "react";
import { OverlappingMarkerSpiderfier } from "ts-overlapping-marker-spiderfier";
import { IAsset } from "types/asset";
import { AssetInfoWindowInner } from "./AssetInfoWindow";

interface AssetMarkerProps {
  asset: IAsset;
  clusterer: Clusterer;
  oms: OverlappingMarkerSpiderfier;
}
const AssetMarker = ({ asset, clusterer, oms }: AssetMarkerProps) => {
  const [position, setposition] = useState({
    lat: asset.latitude!,
    lng: asset.longitude!,
  });

  const { setPromises, selectedAsset, setSelectedAsset } = useAssetMapContext();
  const dataProvider = useRoundwareDataProvider();
  const isEdited = useMemo(
    () =>
      !isEqual(position, {
        lat: asset.latitude!,
        lng: asset.longitude!,
      }),
    [position.lat, position.lng, asset.latitude, asset.longitude]
  );

  return (
    <Marker
      position={position}
      clusterer={clusterer}
      icon={{
        url: isEdited
          ? `https://fonts.gstatic.com/s/i/materialicons/edit_location/v16/24px.svg`
          : `https://fonts.gstatic.com/s/i/materialicons/location_on/v15/24px.svg`,
        fillColor: red[200],
        strokeColor: red[200],
      }}
      onLoad={(m) => oms.addMarker(m, () => setSelectedAsset(asset))}
      noClustererRedraw={true}
      draggable
      onClick={() => setSelectedAsset(asset)}
      onDragEnd={(ev) => {
        const newLat = ev.latLng?.lat();
        const newLng = ev.latLng?.lng();

        if (newLat == asset.latitude && newLng == asset.longitude) return;
        setposition({
          lat: newLat!,
          lng: newLng!,
        });

        const isDifferent = !isEqual(
          {
            lat: newLat!,
            lng: newLng!,
          },
          {
            lat: asset.latitude!,
            lng: asset.longitude!,
          }
        );
        setPromises((prev) => [
          ...clone(prev).filter((p) => p.id != asset.id),
          ...(isDifferent
            ? [
                {
                  id: asset.id,
                  promise: () =>
                    dataProvider
                      .update(`assets`, {
                        id: asset.id,
                        data: {
                          latitude: newLat!.toString(),
                          longitude: newLng!.toString(),
                          dummy: new Blob(),
                        },
                        previousData: asset,
                      })
                      .then((d) =>
                        setposition({
                          lat: parseFloat(d.data.latitude),
                          lng: parseFloat(d.data.longitude),
                        })
                      ),
                },
              ]
            : []),
        ]);
      }}
    >
      {selectedAsset?.id == asset.id && <AssetInfoWindowInner asset={asset} />}
    </Marker>
  );
};

export default AssetMarker;
