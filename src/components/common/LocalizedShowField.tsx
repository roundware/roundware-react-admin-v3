import React from "react";
import { useRecordContext } from "react-admin";
import { Box, Chip, Typography } from "@mui/material";
import { LocalizedString } from "types";

interface Props {
  /** The `_loc_admin` source field on the record, e.g. "description_loc_admin" */
  source: string;
  /** Fallback plain-text source, e.g. "description" */
  fallbackSource?: string;
}

/**
 * Read-only display of localized strings from `_loc_admin` arrays.
 * Shows each language's translation as a labelled row.
 * Falls back to the plain field value when no localizations exist.
 */
const LocalizedShowField = ({ source, fallbackSource }: Props) => {
  const record = useRecordContext();
  if (!record) return null;

  const entries: LocalizedString[] | undefined = record[source];

  // If no localization entries, fall back to plain value
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    const fallback = fallbackSource ? record[fallbackSource] : undefined;
    if (!fallback) {
      return (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      );
    }
    return <Typography variant="body2">{fallback}</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {entries.map((entry) => (
        <Box
          key={entry.language_id}
          sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
        >
          <Chip
            label={entry.language_code?.toUpperCase() || `#${entry.language_id}`}
            size="small"
            variant="outlined"
            sx={{ minWidth: 40, fontWeight: 600 }}
          />
          <Typography variant="body2" sx={{ pt: 0.25 }}>
            {entry.text || (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                —
              </Typography>
            )}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default LocalizedShowField;
