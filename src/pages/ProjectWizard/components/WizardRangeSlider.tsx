// ---------------------------------------------------------------------------
// Standalone range slider for the wizard (no react-admin form context)
// ---------------------------------------------------------------------------
import React from "react";
import { Box, Slider, TextField, Typography } from "@mui/material";

interface WizardRangeSliderProps {
  label: string;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  min: number;
  max: number;
  step: number;
}

const WizardRangeSlider: React.FC<WizardRangeSliderProps> = ({
  label,
  minValue,
  maxValue,
  onChange,
  min,
  max,
  step,
}) => {
  const handleSliderChange = (_: Event, value: number | number[]) => {
    if (Array.isArray(value)) {
      onChange(value[0], value[1]);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Slider
        value={[minValue, maxValue]}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        sx={{ mx: 1 }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          label="Min"
          type="number"
          value={minValue}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v, maxValue);
          }}
          size="small"
          inputProps={{ min, max, step }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Max"
          type="number"
          value={maxValue}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(minValue, v);
          }}
          size="small"
          inputProps={{ min, max, step }}
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
};

export default WizardRangeSlider;
