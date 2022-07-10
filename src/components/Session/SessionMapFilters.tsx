import ChevronRight from "@mui/icons-material/ChevronRight";
import {
  Box,
  Chip,
  Collapse,
  darken,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { green, grey, red, yellow } from "@mui/material/colors";
import { useSesisonMap } from "context/SessionMapContext";
import useBoolean from "hooks/useBoolean";
import React from "react";
import { EventType } from "types/event";

type ColorVariant = {
  color: string;
  contrastColor: string;
};
const colorVariants: Record<"green" | "yellow" | "red" | "grey", ColorVariant> =
  {
    green: {
      color: green[800],
      contrastColor: `#fff`,
    },
    yellow: {
      color: yellow[900],
      contrastColor: `#fff`,
    },
    red: {
      color: red[500],
      contrastColor: "#fff",
    },
    grey: {
      color: grey[700],
      contrastColor: "#fff",
    },
  };

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  {
    color: string;
    contrastColor: string;
  }
> = {
  location_update: colorVariants.yellow,
  change_listen_mode: colorVariants.green,
  filter_stream: colorVariants.green,
  pause_stream: colorVariants.green,
  play_stream: colorVariants.green,
  end_record: colorVariants.red,
  upload_asset: colorVariants.red,
  start_record: colorVariants.red,
  share_map: colorVariants.grey,
  start_session: colorVariants.grey,
};

const SessionMapFilters = () => {
  const { selectedFilters, setSelectedFilters, showArrows } = useSesisonMap();
  const open = useBoolean(true);
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
          {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((t) => {
            const selected = selectedFilters.includes(t);
            const config = EVENT_TYPE_CONFIG[t];
            return (
              <Chip
                variant={selected ? `filled` : `outlined`}
                onClick={() =>
                  setSelectedFilters((prev) =>
                    prev.includes(t)
                      ? [...prev.filter((p) => p != t)]
                      : [...prev.filter((p) => p != t), t]
                  )
                }
                sx={{
                  backgroundColor: selected
                    ? config.color
                    : config.contrastColor,
                  color: selected
                    ? config.contrastColor
                    : darken(config.color, 0.1),
                  "&:hover": {
                    backgroundColor: darken(
                      selected ? config.color : config.contrastColor,
                      0.3
                    ),
                  },
                  borderColor: selected
                    ? darken(config.contrastColor, 0.5)
                    : config.color,
                }}
                label={t}
                key={t}
              />
            );
          })}
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
