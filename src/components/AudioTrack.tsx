import { Typography } from "@material-ui/core";
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
} from "react-admin";
import RangeSlider from "./common/RangeSlider";
export const AudioTrackList = (props: ListProps): JSX.Element => {
  return (
    <List {...props}>
      <Datagrid rowClick="edit">
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
const RangeDisplay = ({ record, source }: FieldProps) => {
  const min = record?.[`min${source}`];
  const max = record?.[`max${source}`];
  return (
    <Typography>
      {min} - {max}
    </Typography>
  );
};
export const AudioTrackEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
      <SimpleForm>
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
          unit="s"
          label="Playback Duration (seconds)"
          min={0}
        />
        <RangeSlider
          source="deadair"
          label="Silence Duration (seconds)"
          min={0}
        />
        <RangeSlider
          source="fadeintime"
          unit="s"
          label="Fade In Time (seconds)"
          step={0.1}
        />
        <RangeSlider
          source="fadeouttime"
          unit="s"
          label="Fade Out Time (seconds)"
          step={0.1}
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
          unit="s"
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
    <Create {...props}>
      <SimpleForm>
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
          unit="s"
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
          unit="s"
          label="Fade In Time (seconds)"
          defaultValue={[0, 20]}
        />
        <RangeSlider
          source="fadeouttime"
          step={0.1}
          unit="s"
          label="Fade Out Time (seconds)"
          defaultValue={[0, 20]}
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
          unit="s"
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
