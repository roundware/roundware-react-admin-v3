import {
  Box,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import useFieldValue from "hooks/useFieldValue";
import React, { useEffect, useRef, useState } from "react";

const UIItemFilterField = () => {
  const [data, setData] = useFieldValue<string>(`uiitem_filter`);
  const [value, setValue] = useState(data?.split(`-`)[0]);
  const [randomValue, setRandomValue] = useState(data?.split(`-`)[1] ?? "1");
  const textFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value === "random") {
      textFieldRef.current?.focus();
    }
  }, [value]);

  useEffect(() => {
    if (value === "random") {
      setData(`${value}-${randomValue}`);
    } else {
      setData(value);
    }
  }, [value, randomValue]);

  return (
    <Box mb={4}>
      <FormLabel>UI Item Filter</FormLabel>
      <RadioGroup value={value} onChange={(e, v) => setValue(v)}>
        <FormControlLabel control={<Radio value="none" />} label="None" />
        <Stack direction={"row"} spacing={1} alignItems="center">
          <FormControlLabel control={<Radio value="random" />} label="Random" />
          <TextField
            size="small"
            type="number"
            value={randomValue}
            disabled={value !== "random"}
            inputRef={textFieldRef}
            onChange={(e) => {
              setRandomValue(e.target.value);
            }}
            error={isNaN(parseInt(randomValue))}
            helperText={!isNaN(parseInt(randomValue)) ? "" : "Invalid Number"}
          />
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default UIItemFilterField;
