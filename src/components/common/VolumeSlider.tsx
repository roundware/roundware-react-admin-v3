import { Stack, Slider, Typography } from "@mui/material";
import withStyles from "@mui/styles/withStyles";
import VolumeUp from "@mui/icons-material/VolumeUp";
import React from "react";
import useFieldValue from "../../hooks/useFieldValue";
interface Props {
  field?: string;
}

const VolumeSlider = ({ field = `volume` }: Props): JSX.Element => {
  const [volume, setVolume] = useFieldValue<number>(field);
  return (
    <Stack
      direction="column"
      spacing={1}
      alignItems="center"
      style={{ height: "100%" }}
    >
      <Typography>Volume</Typography>

      <Typography variant="subtitle1">{(volume * 100).toFixed(0)} %</Typography>

      <VolumeSliderVariant
        orientation="vertical"
        valueLabelDisplay="off"
        value={(volume || 1) * 100}
        onChange={(e, v) => setVolume(Number((Number(v) / 100).toFixed(2)))}
        sx={{
          flexGrow: 1,
        }}
      />

      <VolumeUp />
    </Stack>
  );
};

export default VolumeSlider;

export const VolumeSliderVariant = withStyles({})(Slider);
