import { Box, Grid } from "@mui/material";
import Slider, { SliderProps } from "@mui/material/Slider";
import makeStyles from '@mui/styles/makeStyles';
import Typography from "@mui/material/Typography";
import useFieldValue from "hooks/useFieldValue";
import React from "react";
import { NumberInput } from "react-admin";
interface Props extends Omit<SliderProps, "defaultValue"> {
  minField?: string;
  maxField?: string;
  source?: string;
  label?: string;
  unit?: string;
  defaultValue?: [number, number];
  forceMax?: number;
}

const RangeSlider = ({
  source,
  minField,
  maxField,
  label,
  unit,
  defaultValue,
  max = 100,
  min = 0,
  forceMax,
  step = 1,
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
    <Box mb={3} mt={2}>
      <Typography gutterBottom>{label}</Typography>
      <Slider
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        defaultValue={defaultValue}
        {...props}
        min={min}
        max={
          typeof forceMax == "number"
            ? forceMax
            : value[1] >= max
            ? value[1] + 10
            : max
        }
        step={step}
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
            <NumberInput
              source={minField || `min${source}`}
              label={capitalize(minField) || `Min ${label}`}
              InputLabelProps={{
                style: {
                  width: 300,
                },
              }}
              size="small"
              variant="outlined"
              helperText={unit}
              max={forceMax}
              min={min}
              step={Number(step) || 1}
            />
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="caption" color="secondary">
            <NumberInput
              source={maxField || `max${source}`}
              label={capitalize(maxField) || `Max ${label}`}
              variant="outlined"
              size="small"
              helperText={unit}
              max={forceMax}
              min={min}
              step={Number(step) || 1}
              InputLabelProps={{
                style: {
                  width: 300,
                },
              }}
            />
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

const capitalize = (label?: string) =>
  label ? label.charAt(0).toUpperCase() + label.slice(1) : false;

export default RangeSlider;
