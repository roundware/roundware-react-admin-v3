import React from "react";
import Typography from "@material-ui/core/Typography";
import Slider, { SliderProps } from "@material-ui/core/Slider";
import { Box, Grid } from "@material-ui/core";
import useFieldValue from "hooks/useFieldValue";
import { makeStyles } from "@material-ui/core/styles";
interface Props extends Omit<SliderProps, "defaultValue"> {
  minField?: string;
  maxField?: string;
  source?: string;
  label?: string;
  unit?: string;
  defaultValue?: [number, number];
}

const RangeSlider = ({
  source,
  minField,
  maxField,
  label,
  unit,
  defaultValue,
  ...props
}: Props): JSX.Element => {
  const [minValue, setMin] = useFieldValue<number>(
    minField || `min${source}`,
    Array.isArray(defaultValue) ? defaultValue[0] : undefined
  );
  const [maxValue, setMax] = useFieldValue<number>(
    maxField || `max${source}`,
    Array.isArray(defaultValue) ? defaultValue[1] : undefined
  );
  const value = [minValue, maxValue];
  const handleChange = (e: unknown, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setMin(newValue[0]);
      setMax(newValue[1]);
    }
  };

  const useStyles = makeStyles({
    root: {
      "&>.MuiSlider-thumb": {
        "&:nth-child(4)": {
          color: "#ed7d31 !important",
        },
        "&:nth-child(5)": {
          color: "secondary.main !important",
        },
      },
    },
  });
  const classes = useStyles();

  return (
    <Box mb={2}>
      <Typography gutterBottom>{label}</Typography>
      <Slider
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        defaultValue={defaultValue}
        {...props}
        className={classes.root}
      />
      <Grid container spacing={2}>
        <Grid item>
          <Typography
            style={{
              color: "#ed7d31",
            }}
            variant="caption"
          >
            Min: {minValue}
            {unit}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="caption" color="secondary">
            Max: {maxValue}
            {unit}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RangeSlider;
