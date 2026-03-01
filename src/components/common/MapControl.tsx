import React, { useRef, useEffect } from "react";

import { createPortal } from "react-dom";

import { useGoogleMap } from "@react-google-maps/api";

type MapControlProps = React.PropsWithChildren<{
  position: google.maps.ControlPosition;
}>;

export default function MapControl(props: MapControlProps): JSX.Element {
  const { position, children } = props;

  const map = useGoogleMap();

  // Use a ref so the same container is reused across StrictMode remounts,
  // and we can reliably remove it on cleanup.
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
  }
  const container = containerRef.current;

  useEffect(() => {
    if (!map) return;
    const controls = map.controls[position];
    controls.push(container);
    return () => {
      // Remove container from the Google Maps controls array on unmount
      for (let i = controls.getLength() - 1; i >= 0; i--) {
        if (controls.getAt(i) === container) {
          controls.removeAt(i);
          break;
        }
      }
    };
  }, [container, map, position]);

  return createPortal(children, container);
}
