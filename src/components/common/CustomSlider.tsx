import { Stack, Slider, Typography } from "@mui/material";
import withStyles from "@mui/styles/withStyles";
import React from "react";
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
}: Props): JSX.Element => {
  const [value, setValue] = useFieldValue<number>(field);
  React.useEffect(() => {
    setValue(value || defaultValue);
  }, []);
  return (
    <Stack
      direction={vertical ? "column" : `row`}
      spacing={1}
      alignItems="center"
      justifyContent="center"
      style={{ height: "100%", minHeight: 300 }}
    >
      <Typography>{label}</Typography>

      <Typography align="center" variant="subtitle1">
        {Number(value)?.toFixed(0)}
      </Typography>

      {!vertical ? icon : null}

      <CustomSliderVariant
        orientation={vertical ? "vertical" : `horizontal`}
        valueLabelDisplay="off"
        value={value}
        onChange={(e, v) => setValue(Number(v))}
      />

      {vertical ? icon : null}
    </Stack>
  );
};

export default CustomSlider;

export const CustomSliderVariant = Slider;
