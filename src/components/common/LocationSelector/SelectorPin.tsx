import React, { useEffect } from "react";
import { MarkerF, useGoogleMap } from "@react-google-maps/api";

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
    <MarkerF
      draggable={true}
      position={{
        lat,
        lng,
      }}
      icon={{
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#e53935",
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: "#b71c1c",
        scale: 1.5,
        anchor: typeof google !== "undefined" ? new google.maps.Point(12, 22) : undefined,
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
