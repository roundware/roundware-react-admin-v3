import { useEffect } from "react";
import { useRefresh } from "react-admin";
import { useRoundwareDataProvider } from "context/DataProviderContext";

/**
 * Keeps what the admin shows up to date without anyone pressing refresh.
 *
 * The data provider serves lists from its cache and refetches them behind the
 * scenes; when a refetch finds new data this re-renders the page. Returning to
 * the tab marks every cached list stale and refetches what is on screen — the
 * common case being a contribution just made in the web app in another tab.
 *
 * Replaces the header's refresh button, which forced a refetch by hand (and
 * failed with "Not Found" on any page that was not a list).
 */
const AutoRefresh = () => {
  const refresh = useRefresh();
  const dataProvider = useRoundwareDataProvider();

  useEffect(() => dataProvider.onChange(() => refresh()), [dataProvider, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      dataProvider.markAllStale();
      refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [dataProvider, refresh]);

  return null;
};

export default AutoRefresh;
