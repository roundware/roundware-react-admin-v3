// ---------------------------------------------------------------------------
// Bulk upload's sending (server docs/032): a few files at a time, recordings
// before what's attached to them, carrying on past a failure. Each is an
// ordinary "add a contribution" from the team (POST /assets/), with its
// date recorded.
// ---------------------------------------------------------------------------
import { XMLHttpRequestWithAuthToken } from "roundwareDataProvider/tokenAuthProvider";
import type { Ready } from "./model";

export const AT_ONCE = 3;

export type Status = "waiting" | "sending" | "processing" | "done" | "failed" | "stopped";
export interface Progress {
  status: Status;
  /** 0–1, while sending. */
  sent: number;
  id?: number;
  error?: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function form(projectId: number, r: Ready, parent: { id: number; latitude: number | null; longitude: number | null } | null) {
  const f = new FormData();
  f.append("project_id", String(projectId));
  f.append("media_type", r.kind);
  f.append("description", r.description);
  if (r.tagIds.length) f.append("tag_ids", r.tagIds.join(","));
  // An attachment with no place of its own goes where its recording is.
  const lat = r.latitude ?? parent?.latitude ?? null;
  const lng = r.longitude ?? parent?.longitude ?? null;
  if (lat !== null && lng !== null) {
    f.append("latitude", String(lat));
    f.append("longitude", String(lng));
  }
  if (r.recordedAt) f.append("recorded_at", r.recordedAt);
  if (r.languageId) f.append("language_id", String(r.languageId));
  f.append("submitted", r.submitted ? "true" : "false");
  const parentId = parent?.id ?? r.attachToId;
  if (parentId) f.append("parent_asset_id", String(parentId));
  f.append("file", r.file, r.file.name);
  return f;
}

/** Send one; on "too many at once" (429), wait and try again. */
async function send(
  projectId: number,
  r: Ready,
  parent: { id: number; latitude: number | null; longitude: number | null } | null,
  onSent: (fraction: number) => void
): Promise<number> {
  const url = `${import.meta.env.VITE_SERVER_URL}/api/3/assets/`;
  for (let attempt = 0; ; attempt++) {
    try {
      const { json } = await XMLHttpRequestWithAuthToken(url, { method: "POST", body: form(projectId, r, parent) }, (e) => {
        if (e.lengthComputable) onSent(e.loaded / e.total);
      });
      return json.id as number;
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 429 && attempt < 5) {
        await wait(15_000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
}

export interface Run {
  stop: () => void;
  done: Promise<void>;
}

/** Upload `items` (some may already be done, on a retry). `update` is
 *  called with each row's progress as it changes. */
export function run(
  projectId: number,
  items: Ready[],
  start: Record<string, Progress>,
  update: (rowId: string, p: Progress) => void
): Run {
  const state: Record<string, Progress> = { ...start };
  const set = (id: string, p: Progress) => {
    state[id] = p;
    update(id, p);
  };
  let stopped = false;
  const byRow = new Map(items.map((r) => [r.row.id, r]));

  const next = (): Ready | null | "wait" => {
    let blocked = false;
    for (const r of items) {
      if (state[r.row.id]?.status !== "waiting") continue;
      if (r.attachToRow) {
        const parent = state[r.attachToRow];
        if (!parent || parent.status === "waiting" || parent.status === "sending" || parent.status === "processing") {
          blocked = true;
          continue;
        }
        if (parent.status !== "done") {
          set(r.row.id, { status: "failed", sent: 0, error: "What it's attached to didn't upload." });
          continue;
        }
      }
      return r;
    }
    return blocked ? "wait" : null;
  };

  const worker = async () => {
    for (;;) {
      if (stopped) return;
      const r = next();
      if (r === null) return;
      if (r === "wait") {
        await wait(300);
        continue;
      }
      const id = r.row.id;
      set(id, { status: "sending", sent: 0 });
      const parentRow = r.attachToRow ? byRow.get(r.attachToRow) : undefined;
      const parent =
        parentRow && state[parentRow.row.id]?.id
          ? { id: state[parentRow.row.id].id!, latitude: parentRow.latitude, longitude: parentRow.longitude }
          : null;
      try {
        const newId = await send(projectId, r, parent, (fraction) =>
          set(id, { status: fraction >= 1 ? "processing" : "sending", sent: fraction })
        );
        set(id, { status: "done", sent: 1, id: newId });
      } catch (e) {
        set(id, { status: "failed", sent: 0, error: e instanceof Error ? e.message : String(e) });
      }
    }
  };

  const done = Promise.all(Array.from({ length: AT_ONCE }, worker)).then(() => {
    for (const r of items) if (state[r.row.id]?.status === "waiting") set(r.row.id, { status: "stopped", sent: 0 });
  });
  return {
    stop: () => {
      stopped = true;
    },
    done,
  };
}
