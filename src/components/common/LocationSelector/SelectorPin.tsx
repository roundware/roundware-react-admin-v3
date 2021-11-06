import React, { useEffect } from "react";
import { Marker, useGoogleMap } from "@react-google-maps/api";

interface Props {
  onChange: (lat: number, lng: number) => void;
  lat: number;
  lng: number;
}
const SelectorPin = ({ onChange, lat, lng }: Props): JSX.Element => {
  const map = useGoogleMap();

  useEffect(() => {
    if (lat && lng && map !== null) {
      map.panTo({
        lat,
        lng,
      });
    }
  }, [lat, lng]);

  return (
    <Marker
      draggable={true}
      position={{
        lat,
        lng,
      }}
      onDragEnd={(evt) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //   @ts-ignore
        onChange(evt.latLng.lat(), evt.latLng.lng());
      }}
    />
  );
};

export default SelectorPin;
