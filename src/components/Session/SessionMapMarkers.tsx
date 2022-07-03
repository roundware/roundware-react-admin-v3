import { Marker, Polyline } from "@react-google-maps/api";
import { useSesisonMap } from "context/SessionMapContext";
import React, { useMemo } from "react";
const walkingIcon = `M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7`;
const locationPin = `M12,2C8.14,2,5,5.14,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.14,15.86,2,12,2z M12,4c1.1,0,2,0.9,2,2c0,1.11-0.9,2-2,2 s-2-0.89-2-2C10,4.9,10.9,4,12,4z M12,14c-1.67,0-3.14-0.85-4-2.15c0.02-1.32,2.67-2.05,4-2.05s3.98,0.73,4,2.05 C15.14,13.15,13.67,14,12,14z`;
const flagIcon = `M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M18,15h-5l-1-2H9.5v5H8V7h6l1,2h3V15 z`;
const SessionMapMarkers = () => {
  const { events } = useSesisonMap();
  const polylinePath = useMemo(
    () =>
      events.map((e) => ({
        lat: e.latitude,
        lng: e.longitude,
      })),
    [events]
  );
  return (
    <div>
      {/* start */}
      {events.length >= 1 && (
        <Marker
          position={{
            lat: events[0].latitude,
            lng: events[0].longitude,
          }}
          // icon={{
          //   path: walkingIcon,
          //   fillColor: `#ff0000`,
          //   fillOpacity: 1,
          // }}
        />
      )}
      {events.length >= 3 &&
        events.slice(1, events.length - 2).map((e) => (
          <Marker
            key={e.id}
            position={{
              lat: e.latitude,
              lng: e.longitude,
            }}
            title={e.event_type + e.client_time!}
            // icon={{
            //   path: locationPin,
            //   fillColor: `#ff0000`,
            //   fillOpacity: 1,
            // }}
          />
        ))}

      {/* end */}
      {events.length >= 2 && (
        <Marker
          position={{
            lat: events[events.length - 1].latitude,
            lng: events[events.length - 1].longitude,
          }}
          // icon={{
          //   path: flagIcon,
          //   fillColor: `#ff0000`,
          //   fillOpacity: 1,
          // }}
        />
      )}

      {/* connecting line */}
      <Polyline
        options={{
          strokeColor: `#bb0000`,
        }}
        path={polylinePath}
      />
    </div>
  );
};

export default SessionMapMarkers;
