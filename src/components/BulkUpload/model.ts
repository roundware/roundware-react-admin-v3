// ---------------------------------------------------------------------------
// Bulk upload (server docs/032): the rows, their columns, reading
// spreadsheets and pasted cells, and checking everything in plain words
// before anything is sent.
//
// Every cell is kept as text, the way a spreadsheet holds it, so a row can
// come from typing, pasting, a CSV or an Excel file alike. Only the review
// step turns text into tags, numbers and dates.
// ---------------------------------------------------------------------------

export type Kind = "audio" | "photo" | "text";

export interface Tag {
  id: number;
  value: string;
  tag_category_id: number | null;
}
export interface Category {
  id: number;
  name: string;
}
export interface Language {
  id: number;
  name: string;
  language_code: string;
}

export type ColumnType = "file" | "text" | "tags" | "number" | "date" | "choice" | "attach";

export interface Column {
  key: string;
  header: string;
  type: ColumnType;
  width: number;
  /** For tags and choices: what can go in it. */
  options?: string[];
  /** Shown under the header and in the template's instructions. */
  help: string;
}

export interface Row {
  id: string;
  cells: Record<string, string>;
}

export const LIVE = "Live";
export const HELD = "Held for review";

/** One column per tag category the project's tags use, so each gets its own
 *  dropdown and a tag's name is only looked for in its own category. */
export function buildColumns(tags: Tag[], categories: Category[], languages: Language[]): Column[] {
  const byCategory = new Map<number | null, string[]>();
  for (const t of tags) {
    const k = t.tag_category_id ?? null;
    byCategory.set(k, [...(byCategory.get(k) ?? []), t.value]);
  }
  const tagColumns: Column[] = [];
  for (const c of categories) {
    const values = byCategory.get(c.id);
    if (values?.length)
      tagColumns.push({
        key: `tag:${c.id}`,
        header: c.name,
        type: "tags",
        width: 170,
        options: values,
        help: "Pick one; for more than one, separate them with ;",
      });
  }
  const loose = byCategory.get(null);
  if (loose?.length)
    tagColumns.push({
      key: "tag:none",
      header: "Tags",
      type: "tags",
      width: 170,
      options: loose,
      help: "Pick one; for more than one, separate them with ;",
    });

  return [
    { key: "file", header: "File", type: "file", width: 200, help: "The file's name, as chosen (e.g. walk-03.wav)" },
    { key: "description", header: "Description", type: "text", width: 240, help: "Optional" },
    ...tagColumns,
    { key: "latitude", header: "Latitude", type: "number", width: 110, help: "e.g. 40.7128 (north is positive)" },
    { key: "longitude", header: "Longitude", type: "number", width: 110, help: "e.g. -74.0060 (east is positive)" },
    {
      key: "recorded",
      header: "Date recorded",
      type: "date",
      width: 150,
      help: "2024-06-03, or 2024-06-03 14:30. Empty: when it's uploaded",
    },
    {
      key: "language",
      header: "Language",
      type: "choice",
      width: 120,
      options: languages.map((l) => l.name),
      help: "Optional",
    },
    {
      key: "status",
      header: "Status",
      type: "choice",
      width: 140,
      options: [LIVE, HELD],
      help: `${LIVE} (on the map now) or ${HELD}. Empty: ${LIVE}`,
    },
    {
      key: "attach",
      header: "Attach to",
      type: "attach",
      width: 170,
      help: "For a photo or text that goes with a recording: that recording's file name, or the number of a contribution already in the project",
    },
  ];
}

// -- files --------------------------------------------------------------------

const AUDIO = /\.(wav|mp3|m4a|aac|aif|aiff|flac|ogg|oga|opus|webm|caf|mp4|wma)$/i;
const PHOTO = /\.(jpe?g|png|gif|webp)$/i;
const TEXT = /\.txt$/i;
export const PHOTO_MAX = 20 * 1024 * 1024;
export const TEXT_MAX = 256 * 1024;

export function kindOf(file: File | { name: string; type?: string }): Kind | null {
  if (AUDIO.test(file.name) || file.type?.startsWith("audio/")) return "audio";
  if (PHOTO.test(file.name)) return "photo";
  if (TEXT.test(file.name)) return "text";
  return null;
}

export const isSpreadsheet = (f: File) => /\.(csv|tsv|xlsx)$/i.test(f.name);

/** A name to match by: no folder, no case. */
export const nameKey = (s: string) => (s.split(/[\\/]/).pop() ?? "").trim().toLowerCase();

let nextId = 0;
export const newRow = (cells: Record<string, string> = {}): Row => ({ id: `r${++nextId}`, cells });

// -- reading text tables (CSV, TSV, pasted cells) -----------------------------

/** A CSV or tab-separated table, as a spreadsheet would write it: quoted
 *  cells, quotes doubled inside them, any line ending, a byte-order mark,
 *  and commas, semicolons (Excel in much of Europe) or tabs between cells. */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  text = text.replace(/^﻿/, "");
  const d = delimiter ?? guessDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === d) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function guessDelimiter(text: string): string {
  const first = text.split(/\r?\n|\r/, 1)[0] ?? "";
  const count = (c: string) => first.split(c).length - 1;
  const counts: [string, number][] = [
    ["\t", count("\t")],
    [";", count(";")],
    [",", count(",")],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

// -- headers ------------------------------------------------------------------

const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Other names people (and old templates) use for a column. */
const ALIASES: Record<string, string[]> = {
  file: ["file", "filename", "files", "name", "audio", "recording"],
  description: ["description", "notes", "caption", "text"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon", "long"],
  recorded: ["daterecorded", "recorded", "recordedat", "recordeddate", "date", "when", "created", "createdat"],
  language: ["language", "lang", "languagecode"],
  status: ["status", "submitted", "live"],
  attach: ["attachto", "attachedto", "parent", "parentfile", "goeswith"],
};

/** Which column each header names, or null. */
export function matchHeaders(headers: string[], columns: Column[]): (string | null)[] {
  return headers.map((h) => {
    const s = simplify(h);
    if (!s) return null;
    const exact = columns.find((c) => simplify(c.header) === s);
    if (exact) return exact.key;
    for (const [key, names] of Object.entries(ALIASES)) if (names.includes(s)) return key;
    if (s === "tags" || s === "tag") return columns.find((c) => c.type === "tags")?.key ?? null;
    return null;
  });
}

/** Does this first row look like headers (rather than data)? */
export function looksLikeHeaders(cells: string[], columns: Column[]): boolean {
  const keys = matchHeaders(cells, columns).filter(Boolean);
  return keys.length >= Math.min(2, cells.filter((c) => c.trim()).length);
}

export interface Merge {
  rows: Row[];
  updated: number;
  added: number;
  ignoredHeaders: string[];
}

/** Rows from a spreadsheet, merged into the table by file name: a row for a
 *  file already there fills in its cells (empty cells change nothing); a
 *  row for a file not chosen yet is added, to be matched when it is. */
export function mergeTable(table: string[][], columns: Column[], rows: Row[]): Merge {
  const [headers, ...data] = table;
  const keys = matchHeaders(headers ?? [], columns);
  const ignoredHeaders = (headers ?? []).filter((h, i) => h.trim() && !keys[i]);
  const fileAt = keys.indexOf("file");
  const out = rows.map((r) => ({ ...r, cells: { ...r.cells } }));
  const byName = new Map(out.map((r) => [nameKey(r.cells.file ?? ""), r]));
  let updated = 0;
  let added = 0;
  for (const line of data) {
    const cells: Record<string, string> = {};
    keys.forEach((k, i) => {
      const v = (line[i] ?? "").trim();
      if (k && v) cells[k] = v;
    });
    if (!Object.keys(cells).length) continue;
    const name = fileAt >= 0 ? nameKey(line[fileAt] ?? "") : "";
    const existing = name ? byName.get(name) : undefined;
    if (existing) {
      const { file: _ignored, ...rest } = cells;
      Object.assign(existing.cells, rest);
      updated++;
    } else {
      const r = newRow(cells);
      out.push(r);
      if (name) byName.set(name, r);
      added++;
    }
  }
  return { rows: out, updated, added, ignoredHeaders };
}

// -- checking -----------------------------------------------------------------

export interface Problem {
  rowId: string;
  column?: string;
  message: string;
  /** Errors stop the row from uploading; warnings don't. */
  error: boolean;
}

/** What a row becomes once checked. */
export interface Ready {
  row: Row;
  file: File;
  kind: Kind;
  description: string;
  tagIds: number[];
  latitude: number | null;
  longitude: number | null;
  recordedAt: string | null; // ISO
  languageId: number | null;
  submitted: boolean;
  /** Another row of this batch, or a contribution already in the project. */
  attachToRow: string | null;
  attachToId: number | null;
}

export interface Checked {
  ready: Ready[];
  problems: Problem[];
}

function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/** The closest option, if it's close enough to be a typo. */
export function didYouMean(value: string, options: string[]): string | null {
  const v = value.toLowerCase();
  let best: string | null = null;
  let bestD = Infinity;
  for (const o of options) {
    const dd = distance(v, o.toLowerCase());
    if (dd < bestD) {
      bestD = dd;
      best = o;
    }
  }
  return best && bestD <= Math.max(2, Math.floor(v.length / 4)) ? best : null;
}

export const splitTags = (s: string) =>
  s
    .split(/[;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

/** "2024-06-03", "2024-06-03 14:30", "2024-06-03T14:30:00", with or without
 *  seconds, read as the browser's local time; a full ISO time with a zone
 *  is taken as it is. */
export function parseDate(s: string): Date | null {
  s = s.trim();
  // A date cell from Excel or Google Sheets, as its day number (days since
  // 30 December 1899; the fraction is the time of day). Five digits: 1927
  // to 2173; four would be a year.
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const w = new Date(Math.round((+s - 25569) * 86_400_000));
    return new Date(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes());
  }
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const [, y, mo, da, h = "0", mi = "0", se = "0"] = m;
  const d = new Date(+y, +mo - 1, +da, +h, +mi, +se);
  if (d.getMonth() !== +mo - 1 || d.getDate() !== +da || +h > 23) return null;
  return d;
}

export function parseStatus(s: string): boolean | null {
  const v = simplify(s);
  if (!v || ["live", "yes", "y", "true", "1", "approved", "submitted"].includes(v)) return true;
  if (["heldforreview", "held", "no", "n", "false", "0", "review", "pending", "hidden"].includes(v)) return false;
  return null;
}

export function check(
  rows: Row[],
  files: File[],
  columns: Column[],
  tags: Tag[],
  languages: Language[]
): Checked {
  const problems: Problem[] = [];
  const ready: Ready[] = [];
  const fileByName = new Map<string, File>();
  for (const f of files) if (!fileByName.has(nameKey(f.name))) fileByName.set(nameKey(f.name), f);
  const rowByName = new Map<string, Row>();
  const seen = new Map<string, number>();
  for (const r of rows) {
    const k = nameKey(r.cells.file ?? "");
    seen.set(k, (seen.get(k) ?? 0) + 1);
    if (k && !rowByName.has(k)) rowByName.set(k, r);
  }
  const tagColumns = columns.filter((c) => c.type === "tags");
  const say = (row: Row, message: string, column?: string, error = true) =>
    problems.push({ rowId: row.id, column, message, error });

  for (const row of rows) {
    const c = row.cells;
    const before = problems.filter((p) => p.error).length;
    const name = (c.file ?? "").trim();
    const file = name ? fileByName.get(nameKey(name)) : undefined;
    if (!name) say(row, "No file named.", "file");
    else if (!file) say(row, `${name} hasn't been chosen. Add it in step 1, or remove this row.`, "file");
    else if ((seen.get(nameKey(name)) ?? 0) > 1) say(row, `${name} is in more than one row.`, "file");
    const kind = file ? kindOf(file) : null;
    if (file && !kind) say(row, `${name} isn't a sound, photo (JPEG, PNG, GIF, WebP) or text (.txt) file.`, "file");
    if (file && kind === "photo" && file.size > PHOTO_MAX) say(row, `${name} is over 20 MB, the most a photo can be.`, "file");
    if (file && kind === "text" && file.size > TEXT_MAX) say(row, `${name} is over 256 KB, the most a text can be.`, "file");

    const tagIds: number[] = [];
    for (const col of tagColumns) {
      const catId = col.key === "tag:none" ? null : Number(col.key.slice(4));
      const own = tags.filter((t) => (t.tag_category_id ?? null) === catId);
      for (const v of splitTags(c[col.key] ?? "")) {
        const t = own.find((x) => x.value.trim().toLowerCase() === v.toLowerCase());
        if (t) tagIds.push(t.id);
        else {
          const guess = didYouMean(v, own.map((x) => x.value));
          say(row, `No ${col.header} tag called "${v}".${guess ? ` Did you mean "${guess}"?` : ""}`, col.key);
        }
      }
    }

    const num = (key: string, label: string, max: number) => {
      const v = (c[key] ?? "").trim().replace(",", ".");
      if (!v) return null;
      const n = Number(v);
      if (!isFinite(n)) {
        say(row, `${label} "${c[key]}" isn't a number.`, key);
        return null;
      }
      if (Math.abs(n) > max) {
        say(row, `${label} ${n} isn't on Earth: it goes from -${max} to ${max}.`, key);
        return null;
      }
      return n;
    };
    const latitude = num("latitude", "Latitude", 90);
    const longitude = num("longitude", "Longitude", 180);
    if ((latitude === null) !== (longitude === null) && problems.filter((p) => p.rowId === row.id && (p.column === "latitude" || p.column === "longitude")).length === 0)
      say(row, "Give both latitude and longitude, or neither.", latitude === null ? "latitude" : "longitude");

    let recordedAt: string | null = null;
    if ((c.recorded ?? "").trim()) {
      const d = parseDate(c.recorded);
      if (!d) say(row, `Date recorded "${c.recorded}" isn't a date this can read. Write it as 2024-06-03, or 2024-06-03 14:30.`, "recorded");
      else if (d.getTime() > Date.now() + 86_400_000) say(row, `Date recorded ${c.recorded} is in the future.`, "recorded");
      else recordedAt = d.toISOString();
    }

    let languageId: number | null = null;
    if ((c.language ?? "").trim()) {
      const v = c.language.trim().toLowerCase();
      const l = languages.find((x) => x.name.toLowerCase() === v || x.language_code.toLowerCase() === v);
      if (l) languageId = l.id;
      else {
        const guess = didYouMean(c.language, languages.map((x) => x.name));
        say(row, `"${c.language}" isn't one of the project's languages.${guess ? ` Did you mean "${guess}"?` : ""}`, "language");
      }
    }

    const submitted = parseStatus(c.status ?? "");
    if (submitted === null) say(row, `Status "${c.status}" should be "${LIVE}" or "${HELD}".`, "status");

    let attachToRow: string | null = null;
    let attachToId: number | null = null;
    const attach = (c.attach ?? "").trim();
    if (attach) {
      const asNumber = attach.replace(/^#/, "");
      if (/^\d+$/.test(asNumber)) attachToId = Number(asNumber);
      else {
        const parent = rowByName.get(nameKey(attach));
        if (!parent) say(row, `"${attach}" (Attach to) isn't a file in this upload.`, "attach");
        else if (parent.id === row.id) say(row, "A file can't be attached to itself.", "attach");
        else if ((parent.cells.attach ?? "").trim())
          say(row, `${parent.cells.file} is itself attached to something; attach to the recording it goes with instead.`, "attach");
        else attachToRow = parent.id;
      }
    }

    const fine = problems.filter((p) => p.error).length === before;
    if (fine && latitude === null && longitude === null && !attach)
      say(row, "No location: it won't be on the map until it has one.", "latitude", false);

    if (fine && file && kind)
      ready.push({
        row,
        file,
        kind,
        description: (c.description ?? "").trim(),
        tagIds,
        latitude,
        longitude,
        recordedAt,
        languageId,
        submitted: submitted ?? true,
        attachToRow,
        attachToId,
      });
  }

  // An attachment whose recording can't go can't go either.
  const readyIds = new Set(ready.map((r) => r.row.id));
  const kept = ready.filter((r) => {
    if (r.attachToRow && !readyIds.has(r.attachToRow)) {
      say(r.row, "What it's attached to has a problem, so it waits too.", "attach");
      return false;
    }
    return true;
  });
  return { ready: kept, problems };
}

// -- attaching by name ----------------------------------------------------------

const stem = (name: string) => nameKey(name).replace(/\.[^.]+$/, "");

export interface AttachByName {
  rows: Row[];
  attached: number;
  /** Photos or texts whose name matches more than one recording. */
  unsure: string[];
}

/** Attach each photo or text to the recording with the same name, minus its
 *  ending: walk-01.jpg and walk-01.txt go with walk-01.wav. Only rows in
 *  `only` (all, without it) that aren't attached to anything yet. */
export function attachByName(rows: Row[], only?: Set<string>): AttachByName {
  const recordings = new Map<string, string[]>();
  for (const r of rows) {
    const f = r.cells.file ?? "";
    if (kindOf({ name: f }) === "audio") recordings.set(stem(f), [...(recordings.get(stem(f)) ?? []), f]);
  }
  let attached = 0;
  const unsure: string[] = [];
  const out = rows.map((r) => {
    const f = r.cells.file ?? "";
    const k = kindOf({ name: f });
    if ((only && !only.has(r.id)) || (k !== "photo" && k !== "text") || (r.cells.attach ?? "").trim()) return r;
    const match = recordings.get(stem(f)) ?? [];
    if (match.length > 1) unsure.push(f);
    if (match.length !== 1) return r;
    attached++;
    return { ...r, cells: { ...r.cells, attach: match[0] } };
  });
  return { rows: out, attached, unsure };
}

// -- writing a results file ---------------------------------------------------

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const q = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}

export function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
