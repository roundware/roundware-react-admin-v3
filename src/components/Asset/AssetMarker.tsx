import { Marker } from "@react-google-maps/api";
import { Clusterer } from "@react-google-maps/marker-clusterer";
import { useAssetMapContext } from "context/AssetMapContext";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { clone, isEqual } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
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
    lat: asset.latitude,
    lng: asset.longitude,
  });

  const { setPromises, selectedAsset, setSelectedAsset, promises } =
    useAssetMapContext();
  const dataProvider = useRoundwareDataProvider();
  const isEdited = useMemo(
    () =>
      !isEqual(position, {
        lat: asset.latitude,
        lng: asset.longitude,
      }),
    [position.lat, position.lng, asset.latitude, asset.longitude]
  );

  useEffect(() => {
    if (promises.length == 0)
      setposition({
        lat: asset.latitude,
        lng: asset.longitude,
      });
  }, [asset.latitude, asset.longitude, promises]);

  return (
    <Marker
      position={position}
      clusterer={clusterer}
      icon={{
        // url: isEdited
        //   ? `https://fonts.gstatic.com/s/i/materialicons/edit_location/v16/24px.svg`
        //   : `https://fonts.gstatic.com/s/i/materialicons/location_on/v15/24px.svg`,
        path: isEdited
          ? `M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm-1.56 10H9v-1.44l3.35-3.34 1.43 1.43L10.44 12zm4.45-4.45l-.7.7-1.44-1.44.7-.7c.15-.15.39-.15.54 0l.9.9c.15.15.15.39 0 .54z`
          : "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: isEdited ? "#ff0000" : `#000`,
        fillOpacity: 1,
        strokeWeight: 0.5,
        scale: 1,
      }}
      onLoad={(m) => oms.addMarker(m, () => setSelectedAsset(asset))}
      noClustererRedraw={true}
      draggable
      onClick={() => setSelectedAsset(asset)}
      onDragEnd={(ev) => {
        const newLat = ev.latLng?.lat();
        const newLng = ev.latLng?.lng();

        if (typeof newLat != "number") return;
        if (typeof newLng != "number") return;
        if (newLat == asset.latitude && newLng == asset.longitude) return;
        setposition({
          lat: newLat,
          lng: newLng,
        });

        const isDifferent = !isEqual(
          {
            lat: newLat,
            lng: newLng,
          },
          {
            lat: asset.latitude,
            lng: asset.longitude,
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
                          latitude: newLat.toString(),
                          longitude: newLng.toString(),
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
      {selectedAsset?.id == asset.id && (
        <AssetInfoWindowInner
          asset={{
            ...asset,
            latitude: position.lat,
            longitude: position.lng,
          }}
        />
      )}
    </Marker>
  );
};

export default AssetMarker;
