// ---------------------------------------------------------------------------
// Bulk upload (server docs/032): many contributions at once, in four steps.
//
// 1. Files     drag in recordings, photos and texts (a folder works too;
//              a spreadsheet of their details can come along).
// 2. Details   a table, one row per file: typed, pasted from a spreadsheet,
//              or filled from the template (Excel, with dropdowns, or CSV).
// 3. Review    every problem in plain words, and a map of where it all goes.
// 4. Upload    a few at a time, carrying on past failures, with a summary.
// ---------------------------------------------------------------------------
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import MapIcon from "@mui/icons-material/Map";
import PlaceIcon from "@mui/icons-material/Place";
import TableViewIcon from "@mui/icons-material/TableView";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Link as MuiLink,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useProjects } from "context/ProjectsContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCreatePath, useNotify } from "react-admin";
import { Link } from "react-router-dom";
import { apiFetcher, tokenTimes } from "roundwareDataProvider/tokenAuthProvider";
import { CellProblems, DetailsTable } from "./DetailsTable";
import { PickOnMap, ReviewMap } from "./Maps";
import {
  Category,
  Language,
  Row,
  Tag,
  buildColumns,
  check,
  download,
  isSpreadsheet,
  kindOf,
  mergeTable,
  nameKey,
  newRow,
  toCsv,
} from "./model";
import { downloadCsvTemplate, downloadExcelTemplate, readSpreadsheet } from "./spreadsheet";
import { Progress, Run, run } from "./upload";

const STEPS = ["Choose files", "Add details", "Review", "Upload"];
const KIND_WORDS = { audio: ["recording", "recordings"], photo: ["photo", "photos"], text: ["text", "texts"] } as const;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

/** Every file in a drop, folders included. */
async function droppedFiles(e: React.DragEvent): Promise<File[]> {
  const items = Array.from(e.dataTransfer.items ?? []);
  const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
  if (!entries.length) return Array.from(e.dataTransfer.files);
  const out: File[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)));
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const child of batch) await walk(child);
      }
    }
  };
  for (const entry of entries) await walk(entry);
  return out;
}

interface Meta {
  tags: Tag[];
  categories: Category[];
  languages: Language[];
}

const BulkUpload: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { selectedProject: project } = useProjects();
  const notify = useNotify();
  const createPath = useCreatePath();

  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [leftOut, setLeftOut] = useState<{ name: string; why: string }[]>([]);
  const [rows, setRowsState] = useState<Row[]>([]);
  const rowsRef = useRef<Row[]>([]);
  const setRows = useCallback((f: (rows: Row[]) => Row[]) => {
    setRowsState((rs) => {
      const next = f(rs);
      rowsRef.current = next;
      return next;
    });
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlight, setHighlight] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [applyCol, setApplyCol] = useState("");
  const [applyValue, setApplyValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [running, setRunning] = useState<Run | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const sheetInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!project) return;
    Promise.all([
      apiFetcher(`/tags/?project_id=${project.id}`),
      apiFetcher(`/tagcategories/`),
      apiFetcher(`/languages/`),
    ])
      .then(([t, c, l]) => {
        const langs = (l.json as Language[]).filter(
          (x) => !project.language_ids?.length || project.language_ids.includes(x.id)
        );
        setMeta({ tags: t.json as Tag[], categories: c.json as Category[], languages: langs });
      })
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)));
  }, [project?.id]);

  const columns = useMemo(
    () => (meta ? buildColumns(meta.tags, meta.categories, meta.languages) : []),
    [meta]
  );
  const checked = useMemo(
    () => (meta ? check(rows, files, columns, meta.tags, meta.languages) : { ready: [], problems: [] }),
    [rows, files, columns, meta]
  );
  const cellProblems = useMemo(() => {
    const out: CellProblems = {};
    for (const p of checked.problems) {
      const k = p.column ?? "file";
      const row = (out[p.rowId] ??= {});
      if (!row[k] || (p.error && !row[k].error)) row[k] = { message: p.message, error: p.error };
    }
    return out;
  }, [checked]);
  const rowNumber = useMemo(() => new Map(rows.map((r, i) => [r.id, i + 1])), [rows]);

  // -- step 1: files ----------------------------------------------------------
  const fillFrom = async (sheet: File, base: Row[]): Promise<Row[]> => {
    try {
      const table = await readSpreadsheet(sheet);
      if (table.length < 2) {
        notify(`${sheet.name} has no rows under its column names.`, { type: "warning" });
        return base;
      }
      const m = mergeTable(table, columns, base);
      notify(
        `${sheet.name}: ${plural(m.updated, "row", "rows")} filled in` +
          (m.added ? `, ${plural(m.added, "row", "rows")} for files not chosen yet` : "") +
          (m.ignoredHeaders.length ? `. Columns not used: ${m.ignoredHeaders.join(", ")}` : "") +
          ".",
        { type: "info", autoHideDuration: 8000 }
      );
      return m.rows;
    } catch (e) {
      notify(`Couldn't read ${sheet.name}: ${e instanceof Error ? e.message : e}`, { type: "error" });
      return base;
    }
  };

  const addFiles = async (list: File[]) => {
    setBusy(true);
    const known = new Set(files.map((f) => nameKey(f.name)));
    const media: File[] = [];
    const sheets: File[] = [];
    const out: { name: string; why: string }[] = [];
    for (const f of list) {
      if (f.name.startsWith(".")) continue; // .DS_Store and the like
      if (isSpreadsheet(f)) sheets.push(f);
      else if (!kindOf(f)) out.push({ name: f.name, why: "not a sound, photo (JPEG, PNG, GIF, WebP) or text (.txt) file" });
      else if (known.has(nameKey(f.name))) out.push({ name: f.name, why: "another file with this name is already chosen" });
      else {
        known.add(nameKey(f.name));
        media.push(f);
      }
    }
    let rs = rowsRef.current;
    const rowNames = new Set(rs.map((r) => nameKey(r.cells.file ?? "")));
    rs = [...rs, ...media.filter((f) => !rowNames.has(nameKey(f.name))).map((f) => newRow({ file: f.name }))];
    for (const s of sheets) rs = await fillFrom(s, rs);
    setFiles((fs) => [...fs, ...media]);
    setRows(() => rs);
    setLeftOut((l) => [...l, ...out]);
    setBusy(false);
  };

  const removeFile = (f: File) => {
    setFiles((fs) => fs.filter((x) => x !== f));
    setRows((rs) => rs.filter((r) => nameKey(r.cells.file ?? "") !== nameKey(f.name) || Object.keys(r.cells).length > 1));
  };

  // -- step 2: details --------------------------------------------------------
  const targets = selected.size ? rows.filter((r) => selected.has(r.id)) : rows;
  const targetWords = selected.size ? plural(selected.size, "selected row", "selected rows") : "all rows";
  const setCells = (values: Record<string, string>) => {
    const ids = new Set(targets.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, cells: { ...r.cells, ...values } } : r)));
  };
  const applyColumn = columns.find((c) => c.key === applyCol);

  const onPasteTable = useCallback(
    (table: string[][]) => {
      const m = mergeTable(table, columns, rowsRef.current);
      setRows(() => m.rows);
      notify(
        `Pasted: ${plural(m.updated, "row", "rows")} filled in by file name` +
          (m.added ? `, ${plural(m.added, "row", "rows")} added` : "") +
          (m.ignoredHeaders.length ? `. Columns not used: ${m.ignoredHeaders.join(", ")}` : "") +
          ".",
        { type: "info", autoHideDuration: 8000 }
      );
    },
    [columns, notify, setRows]
  );
  const tableNotify = useCallback((m: string) => notify(m, { type: "info" }), [notify]);

  const goFix = (rowId: string) => {
    setStep(1);
    setHighlight(rowId);
    setTimeout(() => document.getElementById(`bulk-row-${rowId}`)?.scrollIntoView({ block: "center" }), 50);
    setTimeout(() => setHighlight((h) => (h === rowId ? null : h)), 4000);
  };

  // -- step 4: upload ---------------------------------------------------------
  const start = (only?: Set<string>) => {
    if (!project) return;
    const items = checked.ready;
    const begin: Record<string, Progress> = { ...progress };
    for (const r of items)
      if (!only || only.has(r.row.id)) begin[r.row.id] = { status: "waiting", sent: 0 };
    setProgress(begin);
    setStep(3);
    const r = run(project.id, items, begin, (id, p) => setProgress((s) => ({ ...s, [id]: p })));
    setRunning(r);
    // The list refreshes when this closes, not now: on a project's empty
    // page, the list showing its first contributions would close this too.
    r.done.then(() => setRunning(null));
  };
  const states = Object.values(progress);
  const count = (s: Progress["status"]) => states.filter((p) => p.status === s).length;
  const doneCount = count("done");
  const failed = Object.entries(progress).filter(([, p]) => p.status === "failed" || p.status === "stopped");
  const total = states.length;

  const results = () => {
    const byId = new Map(checked.ready.map((r) => [r.row.id, r]));
    const lines: (string | number | null)[][] = [["row", "file", "result", "contribution id", "problem"]];
    for (const [rowId, p] of Object.entries(progress)) {
      const r = byId.get(rowId);
      lines.push([rowNumber.get(rowId) ?? "", r?.file.name ?? "", p.status === "done" ? "uploaded" : p.status, p.id ?? "", p.error ?? ""]);
    }
    download(`${(project?.name ?? "project").replace(/[^\w-]+/g, "-")}-bulk-upload-results.csv`, toCsv(lines), "text/csv");
  };

  const close = () => {
    if (running || (step < 3 && rows.length) || (step === 3 && failed.length)) setConfirmClose(true);
    else onClose();
  };

  // -- the page ---------------------------------------------------------------
  if (!project)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Choose a project first.</Alert>
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    );

  const kinds = { audio: 0, photo: 0, text: 0 };
  for (const f of files) {
    const k = kindOf(f);
    if (k) kinds[k]++;
  }
  const kindSummary = (counts: Record<string, number>) =>
    (Object.keys(KIND_WORDS) as (keyof typeof KIND_WORDS)[])
      .filter((k) => counts[k])
      .map((k) => plural(counts[k], KIND_WORDS[k][0], KIND_WORDS[k][1]))
      .join(", ");
  const errors = checked.problems.filter((p) => p.error);
  const warnings = checked.problems.filter((p) => !p.error);
  const badRows = new Set(errors.map((p) => p.rowId));
  const readyKinds = { audio: 0, photo: 0, text: 0 };
  checked.ready.forEach((r) => readyKinds[r.kind]++);
  const attached = checked.ready.filter((r) => r.attachToRow || r.attachToId).length;
  const held = checked.ready.filter((r) => !r.submitted).length;
  const token = tokenTimes();
  const minutesLeft = token ? Math.round((token.expiresAt - Date.now()) / 60_000) : null;
  const fileOf = (rowId: string) => rows.find((r) => r.id === rowId)?.cells.file ?? "";

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>Bulk upload to {project.name}</span>
          <IconButton aria-label="Close" onClick={close}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stepper activeStep={step} sx={{ mt: 1.5, maxWidth: 720 }}>
          {STEPS.map((s, i) => (
            <Step key={s} completed={step > i}>
              <StepLabel>{s}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {metaError && <Alert severity="error">Couldn't load the project's tags and languages: {metaError}</Alert>}
        {!meta && !metaError && <LinearProgress />}

        {meta && step === 0 && (
          <Stack spacing={2}>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDragging(false);
                await addFiles(await droppedFiles(e));
              }}
              sx={{
                border: "2px dashed",
                borderColor: dragging ? "primary.main" : "divider",
                bgcolor: dragging ? "action.hover" : undefined,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary" }} />
              <Typography sx={{ mt: 1 }}>
                Drag recordings, photos and text files here, or a whole folder.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sound files of any common kind; photos as JPEG, PNG, GIF or WebP (up to 20 MB); texts as .txt. A
                spreadsheet of their details (.xlsx or .csv) can come too.
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button variant="contained" onClick={() => fileInput.current?.click()} disabled={busy}>
                  Choose files…
                </Button>
                <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={() => folderInput.current?.click()} disabled={busy}>
                  Choose a folder…
                </Button>
              </Stack>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  void addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <input
                ref={folderInput}
                type="file"
                multiple
                hidden
                {...({ webkitdirectory: "", directory: "" } as object)}
                onChange={(e) => {
                  void addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </Box>
            {busy && <LinearProgress />}
            {files.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Chosen: {kindSummary(kinds)}
                </Typography>
                <Box sx={{ maxHeight: 320, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  {files.map((f) => (
                    <Stack key={f.name} direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 0.25, "&:hover": { bgcolor: "action.hover" } }}>
                      <Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 70 }}>
                        {KIND_WORDS[kindOf(f)!][0]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 70, textAlign: "right" }}>
                        {size(f.size)}
                      </Typography>
                      <IconButton size="small" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Box>
              </Box>
            )}
            {rows.length > files.length && (
              <Alert severity="info">
                The spreadsheet names {plural(rows.length - files.length, "file", "files")} not chosen yet. Add them
                here, or they'll be left out.
              </Alert>
            )}
            {leftOut.length > 0 && (
              <Alert severity="warning" onClose={() => setLeftOut([])}>
                Left out:
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {leftOut.slice(0, 12).map((l, i) => (
                    <li key={i}>
                      {l.name}: {l.why}
                    </li>
                  ))}
                  {leftOut.length > 12 && <li>and {leftOut.length - 12} more</li>}
                </Box>
              </Alert>
            )}
          </Stack>
        )}

        {meta && step === 1 && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Type in the table, or paste cells copied from Excel or Google Sheets. Or download the template, fill it in
              with your spreadsheet program, and bring it back: its tag, language and status cells have dropdowns.
              Rows are matched to files by file name.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  downloadExcelTemplate(project.name, columns, rows).catch((e) =>
                    notify(`Couldn't make the template: ${e instanceof Error ? e.message : e}`, { type: "error" })
                  )
                }
              >
                Download template (Excel)
              </Button>
              <Button size="small" onClick={() => downloadCsvTemplate(project.name, columns, rows)}>
                or as CSV
              </Button>
              <Button size="small" variant="outlined" startIcon={<TableViewIcon />} onClick={() => sheetInput.current?.click()}>
                Fill from a spreadsheet…
              </Button>
              <input
                ref={sheetInput}
                type="file"
                accept=".xlsx,.csv,.tsv"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) {
                    const rs = await fillFrom(f, rowsRef.current);
                    setRows(() => rs);
                  }
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                For {targetWords}:
              </Typography>
              <Button
                size="small"
                startIcon={<PlaceIcon />}
                disabled={!rows.length}
                onClick={() => setCells({ latitude: String(project.latitude), longitude: String(project.longitude) })}
              >
                Use the project's location
              </Button>
              <Button size="small" startIcon={<MapIcon />} disabled={!rows.length} onClick={() => setPicking(true)}>
                Pick on the map…
              </Button>
              <TextField
                select
                size="small"
                label="Set"
                value={applyCol}
                onChange={(e) => {
                  setApplyCol(e.target.value);
                  setApplyValue("");
                }}
                sx={{ minWidth: 150 }}
              >
                {columns
                  .filter((c) => c.key !== "file")
                  .map((c) => (
                    <MenuItem key={c.key} value={c.key}>
                      {c.header}
                    </MenuItem>
                  ))}
              </TextField>
              {applyColumn?.options ? (
                <TextField select size="small" label="to" value={applyValue} onChange={(e) => setApplyValue(e.target.value)} sx={{ minWidth: 170 }}>
                  {applyColumn.options.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  size="small"
                  label="to"
                  value={applyValue}
                  disabled={!applyColumn}
                  placeholder={applyColumn?.type === "date" ? "2024-06-03" : ""}
                  onChange={(e) => setApplyValue(e.target.value)}
                />
              )}
              <Button size="small" variant="outlined" disabled={!applyColumn || !rows.length} onClick={() => setCells({ [applyCol]: applyValue })}>
                Apply
              </Button>
              {selected.size > 0 && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setRows((rs) => rs.filter((r) => !selected.has(r.id)));
                    setSelected(new Set());
                  }}
                >
                  Remove selected
                </Button>
              )}
            </Stack>
            {rows.length ? (
              <DetailsTable
                columns={columns}
                rows={rows}
                setRows={setRows}
                problems={cellProblems}
                selected={selected}
                setSelected={setSelected}
                highlight={highlight}
                onPasteTable={onPasteTable}
                notify={tableNotify}
              />
            ) : (
              <Alert severity="info">No files yet: go back and choose some, or fill from a spreadsheet.</Alert>
            )}
            {badRows.size > 0 && (
              <Typography variant="body2" color="error">
                {plural(badRows.size, "row needs", "rows need")} a look: the cells outlined in red. Point at one to see
                why.
              </Typography>
            )}
            <PickOnMap
              open={picking}
              start={{
                lat: Number(targets[0]?.cells.latitude) || project.latitude,
                lng: Number(targets[0]?.cells.longitude) || project.longitude,
              }}
              count={targets.length}
              onClose={() => setPicking(false)}
              onPick={(p) => {
                setCells({ latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6) });
                setPicking(false);
              }}
            />
          </Stack>
        )}

        {meta && step === 2 && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              {checked.ready.length > 0 ? (
                <Alert severity="success">
                  {plural(checked.ready.length, "contribution", "contributions")} ready: {kindSummary(readyKinds)}
                  {attached ? ` (${attached} attached to a recording)` : ""}.{" "}
                  {held ? `${held} held for review, the rest live.` : "All live on the map once uploaded."}
                </Alert>
              ) : (
                <Alert severity="warning">Nothing is ready to upload yet.</Alert>
              )}
              {errors.length > 0 && (
                <Alert severity="error">
                  {plural(badRows.size, "row has", "rows have")} problems and won't be uploaded until fixed:
                  <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, maxHeight: 260, overflow: "auto" }}>
                    {errors.map((p, i) => (
                      <li key={i}>
                        Row {rowNumber.get(p.rowId)}
                        {fileOf(p.rowId) ? ` (${fileOf(p.rowId)})` : ""}: {p.message}{" "}
                        <MuiLink component="button" variant="body2" onClick={() => goFix(p.rowId)}>
                          Fix
                        </MuiLink>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}
              {warnings.length > 0 && (
                <Alert severity="warning">
                  {warnings.length === 1 ? "1 thing" : `${warnings.length} things`} to know (they'll still upload):
                  <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, maxHeight: 160, overflow: "auto" }}>
                    {warnings.map((p, i) => (
                      <li key={i}>
                        Row {rowNumber.get(p.rowId)}
                        {fileOf(p.rowId) ? ` (${fileOf(p.rowId)})` : ""}: {p.message}
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}
              {minutesLeft !== null && minutesLeft < 60 && (
                <Alert severity="info">
                  Your sign-in runs out in {plural(Math.max(0, minutesLeft), "minute", "minutes")}. If it does during the
                  upload, sign in again when asked, then choose "Retry".
                </Alert>
              )}
            </Stack>
            <Box sx={{ flex: 1, minHeight: 360, border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
              <ReviewMap
                fallback={{ lat: project.latitude, lng: project.longitude }}
                points={checked.ready
                  .filter((r) => r.latitude !== null && r.longitude !== null)
                  .map((r) => ({ lat: r.latitude!, lng: r.longitude!, label: r.file.name }))}
              />
            </Box>
          </Stack>
        )}

        {meta && step === 3 && (
          <Stack spacing={1.5}>
            <Typography>
              {running
                ? `Uploading… ${doneCount} of ${total} done.`
                : failed.length
                  ? `${doneCount} of ${total} uploaded. ${plural(failed.length, "didn't", "didn't")}.`
                  : `All ${plural(doneCount, "contribution", "contributions")} uploaded.`}
            </Typography>
            <LinearProgress variant="determinate" value={total ? (100 * (doneCount + failed.length)) / total : 0} />
            <Box sx={{ maxHeight: "calc(100vh - 340px)", overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              {checked.ready
                .filter((r) => progress[r.row.id])
                .map((r) => {
                  const p = progress[r.row.id];
                  return (
                    <Stack key={r.row.id} direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.5, py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 50 }}>
                        Row {rowNumber.get(r.row.id)}
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.file.name}
                      </Typography>
                      <Box sx={{ width: 320, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        {p.status === "waiting" && <Chip size="small" label="Waiting" />}
                        {p.status === "sending" && <LinearProgress variant="determinate" value={p.sent * 100} sx={{ width: 160 }} />}
                        {p.status === "processing" && (
                          <>
                            <CircularProgress size={14} />
                            <Typography variant="caption">Processing</Typography>
                          </>
                        )}
                        {p.status === "done" && (
                          <MuiLink component={Link} to={createPath({ resource: "assets", id: p.id, type: "edit" })} target="_blank" variant="body2">
                            Uploaded (#{p.id})
                          </MuiLink>
                        )}
                        {p.status === "stopped" && <Chip size="small" label="Not sent" />}
                        {p.status === "failed" && (
                          <Typography variant="body2" color="error" sx={{ textAlign: "right" }}>
                            {p.error}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {step === 0 && (
          <Button variant="contained" disabled={!rows.length || busy || !meta} onClick={() => setStep(1)}>
            Next: add details
          </Button>
        )}
        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" disabled={!rows.length} onClick={() => setStep(2)}>
              Next: review
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)}>Back to details</Button>
            <Button variant="contained" disabled={!checked.ready.length} onClick={() => start()}>
              Upload {plural(checked.ready.length, "contribution", "contributions")}
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            {running && (
              <Button color="warning" onClick={() => running.stop()}>
                Stop after these
              </Button>
            )}
            {!running && failed.length > 0 && (
              <Button onClick={() => start(new Set(failed.map(([id]) => id)))}>Retry {plural(failed.length, "file", "files")}</Button>
            )}
            {!running && (
              <Button startIcon={<DownloadIcon />} onClick={results}>
                Results (CSV)
              </Button>
            )}
            <Button variant="contained" disabled={!!running} onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </DialogActions>
      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>{running ? "Stop uploading?" : "Leave bulk upload?"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {running
              ? "What's already uploaded stays. The rest won't be sent."
              : step === 3
                ? "The files that didn't upload won't be sent. You can download the results first."
                : "The details entered here will be lost."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)}>Stay</Button>
          <Button
            color="error"
            onClick={() => {
              running?.stop();
              setConfirmClose(false);
              onClose();
            }}
          >
            {running ? "Stop and leave" : "Leave"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkUpload;
