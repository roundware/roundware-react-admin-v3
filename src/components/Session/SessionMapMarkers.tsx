import { Marker } from "@react-google-maps/api";
import { useSesisonMap } from "context/SessionMapContext";
import React from "react";

const SessionMapMarkers = () => {
  const { events } = useSesisonMap();
  console.log(events);
  return (
    <div>
      {events.map((e) => (
        <Marker
          key={e.id}
          position={{
            lat: e.latitude,
            lng: e.longitude,
          }}
        />
      ))}
    </div>
  );
};

export default SessionMapMarkers;
