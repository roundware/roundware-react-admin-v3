import { Box, Slider, Stack, Typography } from "@mui/material";
import React from "react";
import useFieldValue from "../../hooks/useFieldValue";
interface Props {
  field: string;
  label: string;
  defaultValue?: number;
  icon?: React.ReactNode;
}

/** A 0–100 field as a labeled horizontal slider (the label and value above). */
const CustomSlider = ({ field, label, defaultValue = 100, icon }: Props): JSX.Element => {
  const [value, setValue] = useFieldValue<number>(field, defaultValue);
  // Only a missing value takes the default (0 is a value), and filling it in
  // is no change of the user's.
  React.useEffect(() => {
    if (value == null) setValue(defaultValue, { shouldDirty: false });
  }, []);
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography>{label}</Typography>
        <Typography variant="subtitle1">{Number(value)?.toFixed(0)}</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        {icon}
        <CustomSliderVariant
          aria-label={label}
          valueLabelDisplay="off"
          value={value}
          onChange={(e, v) => setValue(Number(v))}
        />
      </Stack>
    </Box>
  );
};

export default CustomSlider;

export const CustomSliderVariant = Slider;
