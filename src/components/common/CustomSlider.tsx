import React from "react";
import { Grid, Typography, withStyles, Slider } from "@material-ui/core";
import VolumeUp from "@material-ui/icons/VolumeUp";
import useFieldValue from "../../hooks/useFieldValue";
interface Props {
  field: string;
  label: string;
  defaultValue?: number;
  vertical?: boolean;
  icon?: React.ReactNode;
}

const CustomSlider = ({
  field,
  label,
  vertical,
  defaultValue = 100,
  icon,
}: Props) => {
  const [value, setValue] = useFieldValue(field);
  React.useEffect(() => {
    setValue(value || defaultValue);
  }, []);
  return (
    <Grid
      container
      direction={vertical ? "column" : `row`}
      spacing={1}
      alignItems="center"
      justifyContent="center"
      style={{ height: "100%" }}
    >
      <Grid item>
        <Typography>{label}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography align="center" variant="subtitle1">
          {Number(value)?.toFixed(0)}
        </Typography>
      </Grid>
      {!vertical && <Grid item>{icon}</Grid>}
      <Grid item style={{ flexGrow: 1 }}>
        <CustomSliderVariant
          orientation={vertical ? "vertical" : `horizontal`}
          valueLabelDisplay="off"
          value={value}
          onChange={(e, v) => setValue(v)}
        />
      </Grid>
      {vertical && <Grid item>{icon}</Grid>}
    </Grid>
  );
};

export default CustomSlider;

export const CustomSliderVariant = withStyles({
  root: {
    color: "#3f3dc0",
    height: 8,
    "&$vertical": {
      width: 8,
    },
    width: "100%",
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
