import React from "react";
import {
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@material-ui/core";
import { useBuildUI } from "providers/BuildUIContext";
import { IUIGroup } from "types/uiGroups";
const UiModeSelector = (): JSX.Element => {
  const { setUiMode, uiMode } = useBuildUI();
  return (
    <>
      <FormLabel>Select UI Mode</FormLabel>
      <RadioGroup
        row
        value={uiMode}
        onChange={(e, v) => setUiMode(v as IUIGroup[`ui_mode`])}
      >
        <FormControlLabel label="Speak" value="speak" control={<Radio />} />
        <FormControlLabel label="Listen" value="listen" control={<Radio />} />
        <FormControlLabel label="Browse" value="browse" control={<Radio />} />
      </RadioGroup>
    </>
  );
};

export default UiModeSelector;
