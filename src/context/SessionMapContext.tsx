import { Alert, LinearProgress } from "@mui/material";
import { EVENT_TYPES } from "components/Session/SessionMapFilters";
import useBoolean, { UseBooleanType } from "hooks/useBoolean";
import React, { useEffect, useMemo, useState } from "react";
import { useGetList } from "react-admin";
import { useParams } from "react-router-dom";
import { EventPayload, EventType } from "types/event";
import { useRoundwareDataProvider } from "./DataProviderContext";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
type SessionMapContextType = {
  events: (Required<Pick<EventPayload, "latitude" | "longitude" | "id">> &
    EventPayload)[];
  loading: boolean;
  selectedFilters: EventType[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<EventType[]>>;
  showArrows: UseBooleanType;
  selectedEvent: EventPayload | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<EventPayload | null>>;
};
const SessionMapContext = React.createContext<SessionMapContextType>(
  undefined!
);

export const useSesisonMap = () => React.useContext(SessionMapContext);

export const SessionMapContextProvider = (props: AllowChildrenOnlyProps) => {
  const params = useParams();

  const dataProvider = useRoundwareDataProvider();
  const [data, setData] = useState<EventPayload[] | null>(null);

  useEffect(() => {
    dataProvider
      .getList(
        `events`,
        {
          filter: {
            session_id: parseInt(params.sessionId!),
          },
          pagination: {
            perPage: 0,
            page: 0,
          },
          sort: {
            field: "id",
            order: "ASC",
          },
        },
        true
      )
      .then((d) => setData(d.data as EventPayload[]));
  }, []);

  const isLoading = data === null;

  const [selectedFilters, setSelectedFilters] = useState(EVENT_TYPES);

  const events: SessionMapContextType[`events`] = useMemo(
    () =>
      Array.isArray(data)
        ? (data
            .filter(
              (e) =>
                typeof e.latitude == "number" &&
                typeof e.latitude == "number" &&
                selectedFilters.includes(e.event_type!)
            )
            .sort((a, b) =>
              new Date(a.client_time as string) >
              new Date(b.client_time as string)
                ? -1
                : 1
            ) as SessionMapContextType[`events`])
        : [],
    [data, selectedFilters]
  );
  const showArrows = useBoolean();

  const [selectedEvent, setSelectedEvent] = useState<EventPayload | null>(null);
  return (
    <SessionMapContext.Provider
      value={{
        events,
        loading: isLoading,
        selectedFilters,
        setSelectedFilters,
        showArrows,
        selectedEvent,
        setSelectedEvent,
      }}
    >
      {isLoading ? (
        <LinearProgress />
      ) : !data?.length ? (
        <Alert sx={{ my: 4 }} severity="info">
          No Data Available
        </Alert>
      ) : (
        props.children
      )}
    </SessionMapContext.Provider>
  );
};
