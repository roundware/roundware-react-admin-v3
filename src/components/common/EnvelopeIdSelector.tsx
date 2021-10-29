import React, { useState, useEffect } from "react";
import {
  FormControl,
  Radio,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Grid,
} from "@material-ui/core";
import { ReferenceInput, NumberInput } from "react-admin";
import useFieldValue from "hooks/useFieldValue";
interface Props {}

const EnvelopeIdSelector = (props: Props) => {
  const [envelope_ids, setEnvelope_ids] = useFieldValue(`envelope_ids`);

  const [mode, setMode] = useState<`manual` | `createNew`>(
    (Array.isArray(envelope_ids) && envelope_ids.length > 0) ||
      typeof envelope_ids == "number"
      ? `manual`
      : `createNew`
  );

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
          <ReferenceInput
            label="Envelope ID"
            source="envelope_ids"
            reference="envelopes"
          >
            <NumberInput source="id" />
          </ReferenceInput>
        </Grid>
      )}
    </Grid>
  );
};

export default EnvelopeIdSelector;
