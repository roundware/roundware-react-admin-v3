import { Alert, LinearProgress } from "@mui/material";
import React, { useMemo } from "react";
import { useGetList } from "react-admin";
import { useParams } from "react-router-dom";
import { EventPayload } from "types/event";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
type SessionMapContextType = {
  events: (Required<Pick<EventPayload, "latitude" | "longitude" | "id">> &
    EventPayload)[];
  loading: boolean;
};
const SessionMapContext = React.createContext<SessionMapContextType>(
  undefined!
);

export const useSesisonMap = () => React.useContext(SessionMapContext);

export const SessionMapContextProvider = (props: AllowChildrenOnlyProps) => {
  const params = useParams();
  const { data, isLoading } = useGetList<EventPayload>(`events`, {
    filter: {
      session_id: parseInt(params.sessionId!),
    },
  });

  const events: SessionMapContextType[`events`] = useMemo(
    () =>
      Array.isArray(data)
        ? (data
            .filter(
              (e) =>
                typeof e.latitude == "number" && typeof e.latitude == "number"
            )
            .sort((a, b) =>
              new Date(a.client_time as string) >
              new Date(b.client_time as string)
                ? -1
                : 1
            ) as SessionMapContextType[`events`])
        : [],
    [data]
  );
  return (
    <SessionMapContext.Provider
      value={{
        events,
        loading: isLoading,
      }}
    >
      {isLoading ? (
        <LinearProgress />
      ) : !events.length ? (
        <Alert sx={{ my: 4 }} severity="info">
          No Data Available
        </Alert>
      ) : (
        props.children
      )}
    </SessionMapContext.Provider>
  );
};
