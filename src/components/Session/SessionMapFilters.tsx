import ChevronRight from "@mui/icons-material/ChevronRight";
import {
  Box,
  ButtonBase,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useSesisonMap } from "context/SessionMapContext";
import useBoolean from "hooks/useBoolean";
import React from "react";
import { EventType } from "types/event";

export const EVENT_TYPES: EventType[] = [
  `location_update`,
  `change_listen_mode`,
  `end_record`,
  `filter_stream`,

  `pause_stream`,
  `play_stream`,
  `share_map`,
  `start_record`,
  `start_session`,
  `upload_asset`,
];
const SessionMapFilters = () => {
  const { selectedFilters, setSelectedFilters, showArrows } = useSesisonMap();
  const open = useBoolean(false);
  return (
    <Box mb={2} mt={1}>
      <Stack direction="row" style={{ cursor: "pointer" }}>
        <ChevronRight
          style={{
            transform: `rotate(${open.value ? 90 : 0}deg)`,
            transition: "transform 200ms ease",
          }}
        />

        <Typography onClick={open.toggle} gutterBottom>
          Filters
        </Typography>
      </Stack>
      <Collapse in={open.value}>
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
      </Collapse>

      <Box mt={1}>
        <FormControlLabel
          label="Show Arrows"
          control={
            <Switch onChange={showArrows.toggle} value={showArrows.value} />
          }
        />
      </Box>
    </Box>
  );
};

export default SessionMapFilters;
