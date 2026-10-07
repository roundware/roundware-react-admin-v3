import VolumeUp from "@mui/icons-material/VolumeUp";
import { Box, Slider, Stack, Typography } from "@mui/material";
import React from "react";
import useFieldValue from "../../hooks/useFieldValue";
interface Props {
  field?: string;
}

/** A contribution's playback volume, 0–100 %, stored as 0–1. */
const VolumeSlider = ({ field = `volume` }: Props): JSX.Element => {
  const [volume, setVolume] = useFieldValue<number>(field);
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography>Volume</Typography>
        <Typography variant="subtitle1">{((volume ?? 1) * 100).toFixed(0)} %</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <VolumeUp color="action" />
        <Slider
          aria-label="Volume"
          valueLabelDisplay="off"
          value={(volume ?? 1) * 100}
          onChange={(e, v) => setVolume(Number((Number(v) / 100).toFixed(2)))}
        />
      </Stack>
    </Box>
  );
};

export default VolumeSlider;
