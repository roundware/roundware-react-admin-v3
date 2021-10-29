import React from "react";
import { Grid, Typography, withStyles, Slider } from "@material-ui/core";
import VolumeUp from "@material-ui/icons/VolumeUp";
import useFieldValue from "../../hooks/useFieldValue";
interface Props {
  field?: string;
}

const VolumeSlider = ({ field = `volume` }: Props) => {
  const [volume, setVolume] = useFieldValue(`volume`);
  return (
    <Grid
      container
      direction="column"
      spacing={1}
      alignItems="center"
      style={{ height: "100%" }}
    >
      <Grid item>
        <Typography>Volume</Typography>
      </Grid>
      <Grid item>
        <Typography variant="subtitle1">
          {(volume * 100).toFixed(0)} %
        </Typography>
      </Grid>
      <Grid item style={{ flexGrow: 1 }}>
        <VolumeSliderVariant
          orientation="vertical"
          valueLabelDisplay="off"
          value={(volume || 1) * 100}
          onChange={(e, v) => setVolume((Number(v) / 100).toFixed(2))}
        />
      </Grid>
      <Grid item>
        <VolumeUp />
      </Grid>
    </Grid>
  );
};

export default VolumeSlider;

export const VolumeSliderVariant = withStyles({
  root: {
    color: "#52af77",
    height: 8,
    "&$vertical": {
      width: 8,
    },
    marginLeft: -4,
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    marginTop: -8,
    marginLeft: -12,
    "&:focus, &:hover": {
      boxShadow: "0px 0px 0px 8px rgba(84, 199, 97, 0.16)",
    },
    "&$active": {
      boxShadow: "0px 0px 0px 12px rgba(84, 199, 97, 0.16)",
    },
  },
  active: {
    transform: "rotate(-90deg)",
  },
  valueLabel: {
    left: "calc(-50% + 4px)",
    transform: "rotate(-90deg)",
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  rail: {
    height: 8,
    borderRadius: 4,
  },
  vertical: {
    "& $rail": {
      width: 8,
    },
    "& $track": {
      width: 8,
    },
    "& $thumb": {
      marginLeft: -8,
      marginBottom: -11,
    },
  },
})(Slider);
