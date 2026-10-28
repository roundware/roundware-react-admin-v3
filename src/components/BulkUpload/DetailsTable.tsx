// ---------------------------------------------------------------------------
// Bulk upload's table (server docs/032): one row per file, a spreadsheet's
// way. Cells are typed in, picked from a menu (tags, language, status), or
// pasted: cells copied from Excel or Google Sheets fill across and down
// from the cell pasted into; a pasted block that starts with column names
// is matched by name and file instead.
// ---------------------------------------------------------------------------
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Checkbox, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import React, { useCallback, useState } from "react";
import { Column, Row, looksLikeHeaders, parseDelimited, splitTags } from "./model";

export type CellProblems = Record<string, Record<string, { message: string; error: boolean }>>;

interface Props {
  columns: Column[];
  rows: Row[];
  setRows: (f: (rows: Row[]) => Row[]) => void;
  problems: CellProblems;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  highlight: string | null;
  /** A pasted block with its own column names: merged like a spreadsheet. */
  onPasteTable: (table: string[][]) => void;
  notify: (message: string) => void;
}

const cellSx = {
  border: "1px solid",
  borderColor: "divider",
  p: 0,
  position: "relative" as const,
  verticalAlign: "top",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  padding: "6px 8px",
  font: "inherit",
  fontSize: 13,
  background: "transparent",
  color: "inherit",
};

const focusCell = (r: number, c: number) => {
  const el = document.querySelector<HTMLInputElement>(`[data-cell="${r}:${c}"]`);
  el?.focus();
  el?.select();
};

interface RowProps {
  row: Row;
  index: number;
  columns: Column[];
  problems: Record<string, { message: string; error: boolean }> | undefined;
  problemKey: string;
  selected: boolean;
  highlight: boolean;
  onCell: (rowId: string, key: string, value: string) => void;
  onToggle: (rowId: string) => void;
  onRemove: (rowId: string) => void;
  onMenu: (rowId: string, col: Column, anchor: HTMLElement) => void;
  onPaste: (rowIndex: number, colIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
}

const TableRow = React.memo(
  ({ row, index, columns, problems, selected, highlight, onCell, onToggle, onRemove, onMenu, onPaste }: RowProps) => (
    <Box
      component="tr"
      id={`bulk-row-${row.id}`}
      sx={{ bgcolor: highlight ? "warning.light" : selected ? "action.selected" : undefined }}
    >
      <Box component="td" sx={{ ...cellSx, px: 0.5, whiteSpace: "nowrap", fontSize: 12, color: "text.secondary" }}>
        <Checkbox size="small" checked={selected} onChange={() => onToggle(row.id)} sx={{ p: 0.5 }} />
        {index + 1}
      </Box>
      {columns.map((col, ci) => {
        const p = problems?.[col.key];
        const menu = col.type === "tags" || col.type === "choice";
        return (
          <Box
            component="td"
            key={col.key}
            sx={{
              ...cellSx,
              minWidth: col.width,
              maxWidth: col.width * 1.6,
              outline: p ? "2px solid" : undefined,
              outlineColor: p ? (p.error ? "error.main" : "warning.main") : undefined,
              outlineOffset: -2,
            }}
          >
            <Tooltip title={p?.message ?? ""} placement="top" disableInteractive>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input
                  data-cell={`${index}:${ci}`}
                  style={inputStyle}
                  value={row.cells[col.key] ?? ""}
                  aria-label={`${col.header}, row ${index + 1}`}
                  onChange={(e) => onCell(row.id, col.key, e.target.value)}
                  onPaste={(e) => onPaste(index, ci, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || (e.key === "ArrowDown" && !e.altKey)) {
                      e.preventDefault();
                      focusCell(index + 1, ci);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      focusCell(index - 1, ci);
                    } else if (e.key === "ArrowDown" && e.altKey && menu) {
                      onMenu(row.id, col, e.currentTarget);
                    }
                  }}
                />
                {menu && (
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    sx={{ p: 0.25 }}
                    aria-label={`Choose ${col.header}`}
                    onClick={(e) => onMenu(row.id, col, e.currentTarget)}
                  >
                    <ArrowDropDownIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Tooltip>
          </Box>
        );
      })}
      <Box component="td" sx={{ ...cellSx, px: 0.25 }}>
        <IconButton size="small" aria-label={`Remove row ${index + 1}`} onClick={() => onRemove(row.id)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  ),
  (a, b) =>
    a.row === b.row &&
    a.index === b.index &&
    a.columns === b.columns &&
    a.problemKey === b.problemKey &&
    a.selected === b.selected &&
    a.highlight === b.highlight &&
    a.onCell === b.onCell &&
    a.onPaste === b.onPaste
);

export const DetailsTable: React.FC<Props> = ({
  columns,
  rows,
  setRows,
  problems,
  selected,
  setSelected,
  highlight,
  onPasteTable,
  notify,
}) => {
  const [menu, setMenu] = useState<{ rowId: string; col: Column; anchor: HTMLElement } | null>(null);

  const onCell = useCallback(
    (rowId: string, key: string, value: string) =>
      setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [key]: value } } : r))),
    [setRows]
  );
  const selectedRef = React.useRef(selected);
  selectedRef.current = selected;
  const onToggle = useCallback(
    (rowId: string) => {
      const s = new Set(selectedRef.current);
      if (s.has(rowId)) s.delete(rowId);
      else s.add(rowId);
      setSelected(s);
    },
    [setSelected]
  );
  const onRemove = useCallback((rowId: string) => setRows((rs) => rs.filter((r) => r.id !== rowId)), [setRows]);
  const onMenu = useCallback((rowId: string, col: Column, anchor: HTMLElement) => setMenu({ rowId, col, anchor }), []);

  const onPaste = useCallback(
    (rowIndex: number, colIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text/plain");
      if (!/[\t\n\r]/.test(text.replace(/[\r\n]+$/, ""))) return; // one cell: an ordinary paste
      e.preventDefault();
      const table = parseDelimited(text, "\t");
      if (!table.length) return;
      if (looksLikeHeaders(table[0], columns)) {
        onPasteTable(table);
        return;
      }
      let dropped = 0;
      setRows((rs) => {
        const out = rs.map((r) => r);
        table.forEach((line, i) => {
          const r = rowIndex + i;
          if (r >= out.length) {
            dropped++;
            return;
          }
          const cells = { ...out[r].cells };
          line.forEach((v, j) => {
            const col = columns[colIndex + j];
            if (col) cells[col.key] = v.trim();
          });
          out[r] = { ...out[r], cells };
        });
        return out;
      });
      const cols = Math.max(...table.map((l) => l.length));
      notify(
        `Pasted ${table.length} ${table.length === 1 ? "row" : "rows"} × ${cols} ${cols === 1 ? "column" : "columns"}.` +
          (dropped ? ` ${dropped} went past the last row and were left out.` : "")
      );
    },
    [columns, notify, onPasteTable, setRows]
  );

  const current = menu ? rows.find((r) => r.id === menu.rowId)?.cells[menu.col.key] ?? "" : "";
  const chosen = menu?.col.type === "tags" ? splitTags(current).map((s) => s.toLowerCase()) : [current.toLowerCase()];
  const pick = (option: string) => {
    if (!menu) return;
    if (menu.col.type === "tags") {
      const list = splitTags(current);
      const has = list.some((x) => x.toLowerCase() === option.toLowerCase());
      const next = has ? list.filter((x) => x.toLowerCase() !== option.toLowerCase()) : [...list, option];
      onCell(menu.rowId, menu.col.key, next.join("; "));
    } else {
      onCell(menu.rowId, menu.col.key, option);
      setMenu(null);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <Box sx={{ overflow: "auto", maxHeight: "calc(100vh - 330px)", minHeight: 200, border: "1px solid", borderColor: "divider" }}>
      <Box component="table" sx={{ borderCollapse: "collapse", fontSize: 13, minWidth: "100%" }}>
        <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 2, bgcolor: "background.paper" }}>
          <tr>
            <Box component="th" sx={{ ...cellSx, px: 0.5, textAlign: "left" }}>
              <Checkbox
                size="small"
                sx={{ p: 0.5 }}
                checked={allSelected}
                indeterminate={!allSelected && selected.size > 0}
                onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                inputProps={{ "aria-label": "Select all rows" }}
              />
            </Box>
            {columns.map((c) => (
              <Box component="th" key={c.key} sx={{ ...cellSx, px: 1, py: 0.5, textAlign: "left", fontWeight: 600 }}>
                <Tooltip title={c.help} placement="top">
                  <span>{c.header}</span>
                </Tooltip>
              </Box>
            ))}
            <Box component="th" sx={cellSx} />
          </tr>
        </Box>
        <tbody>
          {rows.map((r, i) => {
            const p = problems[r.id];
            return (
              <TableRow
                key={r.id}
                row={r}
                index={i}
                columns={columns}
                problems={p}
                problemKey={p ? JSON.stringify(p) : ""}
                selected={selected.has(r.id)}
                highlight={highlight === r.id}
                onCell={onCell}
                onToggle={onToggle}
                onRemove={onRemove}
                onMenu={onMenu}
                onPaste={onPaste}
              />
            );
          })}
        </tbody>
      </Box>
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)} slotProps={{ paper: { sx: { maxHeight: 360 } } }}>
        {menu?.col.options?.map((o) => (
          <MenuItem key={o} dense onClick={() => pick(o)}>
            {menu.col.type === "tags" && (
              <ListItemIcon>
                <Checkbox size="small" sx={{ p: 0 }} checked={chosen.includes(o.toLowerCase())} />
              </ListItemIcon>
            )}
            <ListItemText>{o}</ListItemText>
          </MenuItem>
        ))}
        {menu && current && menu.col.type === "choice" && (
          <MenuItem dense onClick={() => pick("")}>
            <ListItemText sx={{ fontStyle: "italic" }}>Clear</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};
