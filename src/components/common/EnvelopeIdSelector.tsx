import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import useFieldValue from "hooks/useFieldValue";
import { isNumber } from "lodash";
import React, { useState } from "react";
import {
  AutocompleteArrayInput,
  AutocompleteInput,
  NumberInput,
  ReferenceArrayField,
  ReferenceArrayInput,
  ReferenceInput,
  SelectInput,
  useRecordContext,
} from "react-admin";

const EnvelopeIdSelector = (): JSX.Element => {
  const [envelope_ids, setEnvelope_ids] = useFieldValue<number[] | undefined>(
    `envelope_ids`
  );
  console.log(envelope_ids);
  const [mode, setMode] = useState<`manual` | `createNew`>(
    (Array.isArray(envelope_ids) && envelope_ids.length > 0) ||
      typeof envelope_ids == "number"
      ? `manual`
      : `createNew`
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChangeMode = (e: any, value: "manual" | "createNew") => {
    // clear the previous envelope ids value
    if (value === "createNew") {
      setEnvelope_ids(undefined);
    }
    setMode(value);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <FormControl component="fieldset">
          <FormLabel component="legend">Envelope ID</FormLabel>
          <RadioGroup
            aria-label="gender"
            name="gender1"
            value={mode}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onChange={handleChangeMode}
          >
            <FormControlLabel
              value="createNew"
              control={<Radio />}
              label="Create New Automatically"
            />
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Use an Existing"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      {mode === "manual" && (
        <Grid item>
          <TextField
            value={
              envelope_ids?.toString() == "0" ? `` : envelope_ids?.toString()
            }
            type="number"
            onChange={(e) =>
              isNumber(+e.target.value)
                ? setEnvelope_ids([+e.target.value])
                : undefined
            }
          />
        </Grid>
      )}
    </Grid>
  );
};

export default EnvelopeIdSelector;
