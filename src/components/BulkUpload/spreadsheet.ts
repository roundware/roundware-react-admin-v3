// ---------------------------------------------------------------------------
// Bulk upload's spreadsheets (server docs/032): the template, as an Excel
// file with a dropdown in each tag, language and status cell (they survive
// opening it in Google Sheets), or as a plain CSV; and reading either back.
// ExcelJS is large, so it's loaded only when a template is made or an Excel
// file is read.
// ---------------------------------------------------------------------------
import type { Column, Row } from "./model";
import { download, parseDelimited, toCsv } from "./model";

// Room to add rows by hand below the ones already there.
const SPARE_ROWS = 200;

const colLetter = (n: number) => {
  let s = "";
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

const fileName = (project: string, ext: string) =>
  `${project.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "project"}-bulk-upload.${ext}`;

export async function downloadExcelTemplate(project: string, columns: Column[], rows: Row[]) {
  download(
    fileName(project, "xlsx"),
    await excelTemplate(columns, rows),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

/** The template as an Excel workbook. */
export async function excelTemplate(columns: Column[], rows: Row[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Roundware";
  const sheet = wb.addWorksheet("Contributions", { views: [{ state: "frozen", ySplit: 1 }] });
  const lists = wb.addWorksheet("Lists");
  const help = wb.addWorksheet("How to fill this in");

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: Math.round(c.width / 7) }));
  sheet.getRow(1).font = { bold: true };
  for (const r of rows) sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, r.cells[c.key] ?? ""])));
  // Text, so Excel leaves dates and file names as typed.
  for (const key of ["file", "recorded", "attach"]) {
    const i = columns.findIndex((c) => c.key === key);
    if (i >= 0) sheet.getColumn(i + 1).numFmt = "@";
  }

  // The dropdowns' choices, one column each on the Lists sheet.
  let li = 0;
  const last = rows.length + SPARE_ROWS + 1;
  columns.forEach((c, i) => {
    if (!c.options?.length) return;
    const L = colLetter(li++);
    lists.getCell(`${L}1`).value = c.header;
    lists.getCell(`${L}1`).font = { bold: true };
    c.options.forEach((o, j) => (lists.getCell(`${L}${j + 2}`).value = o));
    lists.getColumn(L).width = Math.max(14, c.header.length + 2, ...c.options.map((o) => o.length + 2));
    const range = `'Lists'!$${L}$2:$${L}$${c.options.length + 1}`;
    for (let r = 2; r <= last; r++)
      sheet.getCell(r, i + 1).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [range],
        // A warning, not a refusal: several tags can be typed, with ;
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: c.header,
        error:
          c.type === "tags"
            ? `That isn't one of the ${c.header} tags. Several can be typed, separated by ; (e.g. "Calm; Loud").`
            : `That isn't one of the choices.`,
        showInputMessage: c.type === "tags",
        promptTitle: c.header,
        prompt: c.type === "tags" ? "Pick one, or type several separated by ;" : "",
      };
  });

  help.columns = [
    { header: "Column", key: "h", width: 20 },
    { header: "What goes in it", key: "w", width: 90 },
  ];
  help.getRow(1).font = { bold: true };
  for (const c of columns) help.addRow({ h: c.header, w: c.help });
  help.addRow({});
  help.addRow({ h: "", w: "One row per file. Back in the admin, choose this file under \"Fill from a spreadsheet\"." });
  help.addRow({ h: "", w: "Rows are matched to the chosen files by file name; empty cells change nothing." });
  help.getColumn(2).alignment = { wrapText: true };

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function downloadCsvTemplate(project: string, columns: Column[], rows: Row[]) {
  const body = [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => r.cells[c.key] ?? ""))];
  download(fileName(project, "csv"), toCsv(body), "text/csv");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** An Excel cell as the text someone typed in it. */
function cellText(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) {
    // Excel stores a date as a time with no zone; ExcelJS gives it as UTC.
    const d = `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
    const t = v.getUTCHours() || v.getUTCMinutes() ? ` ${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}` : "";
    return d + t;
  }
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string };
    if (o.richText) return o.richText.map((p) => p.text).join("");
    if (o.result !== undefined) return cellText(o.result);
    if (o.text !== undefined) return String(o.text);
    return "";
  }
  return String(v);
}

/** A spreadsheet file as rows of text; the first row is its headers. */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { default: ExcelJS } = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const sheet = wb.getWorksheet("Contributions") ?? wb.worksheets[0];
    if (!sheet) return [];
    const out: string[][] = [];
    const width = sheet.columnCount;
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      for (let i = 1; i <= width; i++) cells.push(cellText(row.getCell(i).value).trim());
      if (cells.some(Boolean)) out.push(cells);
    });
    return out;
  }
  if (/\.xls$/i.test(file.name) || /\.numbers$/i.test(file.name))
    throw new Error("Save it as an Excel workbook (.xlsx) or CSV first.");
  return parseDelimited(await file.text(), /\.tsv$/i.test(file.name) ? "\t" : undefined);
}
