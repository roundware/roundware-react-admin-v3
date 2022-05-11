import { Typography } from "@mui/material";
import React from "react";
import {
  BooleanField,
  BooleanInput,
  Create,
  CreateProps,
  Datagrid,
  Edit,
  EditProps,
  FieldProps,
  List,
  ListProps,
  SimpleForm,
  TextInput,
  NumberInput,
  TextField,
  useRecordContext,
} from "react-admin";
import RangeSlider from "./common/RangeSlider";
export const AudioTrackList = (): JSX.Element => {
  return (
    <List
      filters={
        [`duration`, `deadair`].flatMap((k) => [
          <NumberInput
            source={"min" + k + "__gte"}
            label={`Min ${k} Greater Than`}
            key={"min" + k + "__gte"}
          />,
          <NumberInput
            source={"min" + k + "__lte"}
            label={`Min ${k} Lesser Than`}
            key={"min" + k + "__lte"}
          />,
          <NumberInput
            source={"max" + k + "__gte"}
            key={"max" + k + "__gte"}
            label={`Max ${k} Greater Than`}
          />,
          <NumberInput
            source={"max" + k + "__lte"}
            key={`max${k}__lte`}
            label={`Max ${k} Lesser Than`}
          />,
        ]) as JSX.Element[]
      }
    >
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <RangeDisplay source="volume" label="Volume" />
        <RangeDisplay source="duration" label="Duration" />
        <RangeDisplay source="deadair" label="Dead Air" />
        <RangeDisplay source="fadeintime" label="Fade In Time" />
        <RangeDisplay source="fadeouttime" label="Fade Out Time" />
        <RangeDisplay source="panpos" label="Pan Position" />
        <RangeDisplay source="panduration" label="Pan Duration" />

        <BooleanField source="repeatrecordings" label="Repeat Recordings" />
        <BooleanField source="start_with_silence" label="Start With Silence" />
        <BooleanField
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
      </Datagrid>
    </List>
  );
};
const RangeDisplay = ({ source }: FieldProps) => {
  const record = useRecordContext();
  const min = record?.[`min${source}`];
  const max = record?.[`max${source}`];
  return (
    <Typography>
      {min} - {max}
    </Typography>
  );
};
export const AudioTrackEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required disabled />
        <RangeSlider
          source="volume"
          label="Volume"
          min={0}
          max={1}
          step={0.1}
          forceMax={1}
        />
        <RangeSlider
          source="duration"
          label="Playback Duration (seconds)"
          min={0}
          step={0.1}
        />
        <RangeSlider
          source="deadair"
          label="Silence Duration (seconds)"
          min={0}
          step={0.1}
        />
        <RangeSlider
          source="fadeintime"
          label="Fade In Time (seconds)"
          step={0.1}
          max={10}
        />
        <RangeSlider
          source="fadeouttime"
          label="Fade Out Time (seconds)"
          step={0.1}
          max={10}
        />
        <RangeSlider
          source="panpos"
          label="Pan Position"
          min={-1}
          max={1}
          step={0.1}
          forceMax={1}
        />
        <RangeSlider
          source="panduration"
          label="Pan Duration (seconds)"
          step={0.1}
        />
        <NumberInput source="banned_duration" defaultValue={0} />
        <BooleanInput source="repeatrecordings" label="Repeat Recordings" />
        <BooleanInput source="start_with_silence" label="Start With Silence" />
        <BooleanInput
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
      </SimpleForm>
    </Edit>
  );
};

export const AudioTrackCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <RangeSlider
          source="volume"
          label="Volume"
          min={0}
          max={1}
          step={0.1}
          defaultValue={[0, 1]}
          forceMax={1}
        />
        <RangeSlider
          source="duration"
          label="Playback Duration (seconds)"
          step={0.1}
          min={0}
          defaultValue={[0, 100]}
        />
        <RangeSlider
          source="deadair"
          label="Silence Duration (seconds)"
          step={0.1}
          min={0}
          defaultValue={[0, 50]}
        />
        <RangeSlider
          source="fadeintime"
          step={0.1}
          label="Fade In Time (seconds)"
          defaultValue={[0, 5]}
          max={10}
        />
        <RangeSlider
          source="fadeouttime"
          step={0.1}
          label="Fade Out Time (seconds)"
          defaultValue={[0, 5]}
          max={10}
        />
        <RangeSlider
          source="panpos"
          label="Pan Position"
          min={-1}
          max={1}
          step={0.1}
          defaultValue={[-0.1, 0.1]}
          forceMax={1}
        />
        <RangeSlider
          source="panduration"
          label="Pan Duration (seconds)"
          step={0.1}
          defaultValue={[0, 60]}
        />
        <NumberInput
          source="banned_duration"
          helperText="Seconds"
          defaultValue={0}
        />
        <BooleanInput source="repeatrecordings" label="Repeat Recordings" />
        <BooleanInput source="start_with_silence" label="Start With Silence" />
        <BooleanInput
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
      </SimpleForm>
    </Create>
  );
};
