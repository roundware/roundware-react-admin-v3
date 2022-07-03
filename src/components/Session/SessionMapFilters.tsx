import { Box, Chip, Stack, Typography } from "@mui/material";
import { useSesisonMap } from "context/SessionMapContext";
import React from "react";
import { EventType } from "types/event";

export const EVENT_TYPES: EventType[] = [
  `change_listen_mode`,
  `end_record`,
  `filter_stream`,
  `location_update`,
  `pause_stream`,
  `play_stream`,
  `share_map`,
  `start_record`,
  `start_session`,
  `upload_asset`,
];
const SessionMapFilters = () => {
  const { selectedFilters, setSelectedFilters } = useSesisonMap();
  return (
    <Box mb={2} mt={1}>
      <Typography gutterBottom>Filters</Typography>
      <Stack overflow="scroll" direction="row" spacing={1}>
        {EVENT_TYPES.map((t) => (
          <Chip
            variant={selectedFilters.includes(t) ? `filled` : `outlined`}
            onClick={() =>
              setSelectedFilters((prev) =>
                prev.includes(t)
                  ? [...prev.filter((p) => p != t)]
                  : [...prev.filter((p) => p != t), t]
              )
            }
            color="primary"
            label={t}
            key={t}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default SessionMapFilters;
