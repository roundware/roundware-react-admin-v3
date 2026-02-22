import { Box, Slider } from "@mui/material";
import React from "react";

type Range = [Date, Date];
type Props = {
  value: Range;
  onChange: (newValue: Range) => void;
  min: number;
  max: number;
};
const dayMs = 8.64e7;

const DateRangeSlider = ({ value, onChange, min, max }: Props) => {
  if (value.length != 2) return null;

  return (
    <Box px={8} pr={3} py={4}>
      <Slider
        value={value.map((d) => d.getTime())}
        onChange={(e, v) => {
          if (Array.isArray(v)) {
            onChange(v.map((v) => new Date(v)) as [Date, Date]);
          }
        }}
        min={min}
        max={max}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => new Date(v).toLocaleDateString()}
        step={dayMs}
        marks={[
          {
            value: min,
            label: new Date(min).toLocaleDateString(),
          },
          {
            value: max,
            label: new Date(max).toLocaleDateString(),
          },
        ]}
      />
    </Box>
  );
};

export default DateRangeSlider;
