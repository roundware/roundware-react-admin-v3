import React from "react";
import useFieldValue from "../../hooks/useFieldValue";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
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
        <FormControlLabel value="speak" control={<Radio />} label="Speak" />
        <FormControlLabel value="listen" control={<Radio />} label="Listen" />
        <FormControlLabel value="browse" control={<Radio />} label="Browse" />
      </RadioGroup>
    </FormControl>
  );
};

export default UiModeField;
