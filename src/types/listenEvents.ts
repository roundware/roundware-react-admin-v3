// A v3 listening-history item (GET /listenevents/, an alias of
// /listeninghistoryitems/). The v2 names are kept optional for the few
// places that still fall back to them.
export type IListenEvent = {
  id: number;
  session_id: number;
  asset_id: number;
  started_at: string;
  duration_sec: number | null;
  /** v2 name for started_at. */
  start_time?: string;
  /** v2 name for duration_sec. */
  duration_in_seconds?: number;
};
