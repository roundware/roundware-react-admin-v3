import React from "react";
import useFieldValue from "../../hooks/useFieldValue";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Stack } from "@mui/material";
import { useBuildUI } from "providers/BuildUIContext";
import { IUIGroup } from "types/uiGroups";
const UiModeField = (): JSX.Element => {
  const [value, setValue] = useFieldValue<string>("ui_mode");
  React.useEffect(() => {
    setValue(value || "speak");
  }, []);

  const { setUiMode } = useBuildUI();

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Select UI Mode</FormLabel>
      <RadioGroup
        aria-label="ui_mode"
        name="ui_mode"
        value={value}
        onChange={(e, v) => {
          setValue(v);
          setUiMode(v as IUIGroup[`ui_mode`]);
        }}
      >
        <Stack direction="row">
          <FormControlLabel value="speak" control={<Radio />} label="Speak" />
          <FormControlLabel value="listen" control={<Radio />} label="Listen" />
          <FormControlLabel value="browse" control={<Radio />} label="Browse" />
        </Stack>
      </RadioGroup>
    </FormControl>
  );
};

export default UiModeField;
