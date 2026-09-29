import { subDays } from "date-fns";
import React, { createContext, useContext, useMemo, useState } from "react";

import { IAssetData } from "roundware-web-framework/dist/types/asset";
import { IAsset } from "types/asset";
import { IListenEvent } from "types/listenEvents";
import { ISession } from "types/session";
import { DateRange } from "../../utils";

const INITIAL_RANGE = [subDays(new Date(), 120), new Date()] as DateRange;

export const ChartsDataContext = createContext({
  assets: [] as IAsset[],
   
  setAssets: ((_assets: IAssetData) => undefined) as unknown as React.Dispatch<
    React.SetStateAction<IAsset[]>
  >,
  assetsAllFetchedRange: [new Date(), new Date()] as DateRange,
   
  setAssetsAllFetchedRange: ((_assetsAllFetchedRange: DateRange) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<DateRange>>,

  listenEvents: [] as IListenEvent[],
   
  setListenEvents: ((_listenEvents: IListenEvent[]) =>
    undefined) as unknown as React.Dispatch<
    React.SetStateAction<IListenEvent[]>
  >,

  sessions: [] as ISession[],
   
  setSessions: ((_sessions: ISession[]) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<ISession[]>>,
  sessionsAllFetchedRange: [new Date(), new Date()] as DateRange,
   
  setSessionsAllFetchedRange: ((_sessionsAllFetchedRange: DateRange) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<DateRange>>,

  // Whether the first fetch of each has finished (success or not). The pie
  // charts draw data the Assets and Sessions charts fetch, so without these
  // they could not tell "still loading" from "nothing there".
  assetsLoaded: false,
  setAssetsLoaded: (() => undefined) as React.Dispatch<React.SetStateAction<boolean>>,
  sessionsLoaded: false,
  setSessionsLoaded: (() => undefined) as React.Dispatch<React.SetStateAction<boolean>>,
});

export const useChartsData = () => useContext(ChartsDataContext);

export const ChartsDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [assetsAllFetchedRange, setAssetsAllFetchedRange] =
    useState<DateRange>(INITIAL_RANGE);
  const [listenEvents, setListenEvents] = useState<IListenEvent[]>([]);

  const [sessions, setSessions] = useState<ISession[]>([]);

  const [sessionsAllFetchedRange, setSessionsAllFetchedRange] =
    useState<DateRange>(INITIAL_RANGE);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const value = useMemo(
    () => ({
      assets,
      setAssets,
      listenEvents,
      setListenEvents,
      assetsAllFetchedRange,
      setAssetsAllFetchedRange,
      sessions,
      setSessions,
      sessionsAllFetchedRange,
      setSessionsAllFetchedRange,
      assetsLoaded,
      setAssetsLoaded,
      sessionsLoaded,
      setSessionsLoaded,
    }),
    [
      assets,
      listenEvents,
      assetsAllFetchedRange,
      sessions,
      sessionsAllFetchedRange,
      assetsLoaded,
      sessionsLoaded,
    ]
  );
  return (
    <ChartsDataContext.Provider value={value}>
      {children}
    </ChartsDataContext.Provider>
  );
};
