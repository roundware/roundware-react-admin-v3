import { subDays } from "date-fns";
import React, { createContext, useContext, useMemo, useState } from "react";

import { IAssetData } from "roundware-web-framework/dist/types/asset";
import { IAsset } from "types/asset";
import { IListenEvent } from "types/listenEvents";
import { ISession } from "types/session";
import { DateRange } from "../../utils.tsx";

const INITIAL_RANGE = [subDays(new Date(), 120), new Date()] as DateRange;

export const ChartsDataContext = createContext({
  assets: [] as IAsset[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAssets: ((_assets: IAssetData) => undefined) as unknown as React.Dispatch<
    React.SetStateAction<IAsset[]>
  >,
  assetsAllFetchedRange: [new Date(), new Date()] as DateRange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAssetsAllFetchedRange: ((_assetsAllFetchedRange: DateRange) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<DateRange>>,

  listenEvents: [] as IListenEvent[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setListenEvents: ((_listenEvents: IListenEvent[]) =>
    undefined) as unknown as React.Dispatch<
    React.SetStateAction<IListenEvent[]>
  >,

  sessions: [] as ISession[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSessions: ((_sessions: ISession[]) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<ISession[]>>,
  sessionsAllFetchedRange: [new Date(), new Date()] as DateRange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSessionsAllFetchedRange: ((_sessionsAllFetchedRange: DateRange) =>
    undefined) as unknown as React.Dispatch<React.SetStateAction<DateRange>>,
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
    }),
    [
      assets,
      listenEvents,
      assetsAllFetchedRange,
      sessions,
      sessionsAllFetchedRange,
    ]
  );
  return (
    <ChartsDataContext.Provider value={value}>
      {children}
    </ChartsDataContext.Provider>
  );
};
