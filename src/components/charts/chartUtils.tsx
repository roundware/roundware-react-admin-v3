import { Box, Typography } from "@mui/material";
import React from "react";

/**
 * Add freshly fetched records to those already held, skipping any already
 * there. The charts share fetched data and each appends to it; a plain
 * append counted records twice whenever a fetch ran twice (React runs mount
 * effects twice in development, and the "fetch earlier" ranges overlap).
 */
export function mergeById<T extends { id: number | string }>(prev: T[], next: T[]): T[] {
  const seen = new Set(prev.map((r) => r.id));
  return [...prev, ...next.filter((r) => !seen.has(r.id))];
}

/**
 * What a chart shows instead of a chart: nothing yet, or a failed fetch.
 * The charts used to show a spinner whenever they had no data, so a
 * project with nothing in range looked as if it was loading forever.
 */
export const ChartMessage = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  </Box>
);

export const LOAD_FAILED = "Couldn't load this data. Try refreshing the page.";
