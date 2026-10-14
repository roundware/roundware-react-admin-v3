// A v3 listening-history item (GET /listenevents/, an alias of
// /listeninghistoryitems/). The v2 names are kept optional for the few
// places that still fall back to them.
export type IListenEvent = {
  id: number;
  session_id: number;
  /** What was heard: a contribution or a speaker, one of them. */
  asset_id: number | null;
  speaker_id: number | null;
  started_at: string;
  duration_sec: number | null;
  /** Where the listener was when it started, when known. */
  latitude?: number | null;
  longitude?: number | null;
  /** v2 name for started_at. */
  start_time?: string;
  /** v2 name for duration_sec. */
  duration_in_seconds?: number;
};
