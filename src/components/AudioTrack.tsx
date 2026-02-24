import { Typography } from "@mui/material";
import React from "react";
import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  FieldProps,
  List,
  SimpleForm,
  TextInput,
  NumberInput,
  TextField,
  useRecordContext,
  SelectInput,
  RaRecord,
} from "react-admin";
import { useProjects } from "../context/ProjectsContext";
import CopyResourceButton from "./common/CopyResource";
import FormToolbar from "./common/FormToolbar";
import RangeSlider from "./common/RangeSlider";

export const AudioTrackList = (): JSX.Element => {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <BooleanField source="is_active" label="Active" />
        <RangeDisplay source="volume" label="Volume" />
        <RangeDisplay source="duration" label="Duration" />
        <RangeDisplay source="dead_air" label="Dead Air" />
        <RangeDisplay source="fade_in_time" label="Fade In Time" />
        <RangeDisplay source="fade_out_time" label="Fade Out Time" />
        <RangeDisplay source="pan_pos" label="Pan Position" />
        <RangeDisplay source="pan_duration" label="Pan Duration" />
        <BooleanField source="repeat_recordings" label="Repeat Recordings" />
        <BooleanField source="start_with_silence" label="Start With Silence" />
        <BooleanField
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
        <TextField source="timed_asset_priority" label="Priority" />
        <CopyResourceButton />
      </Datagrid>
    </List>
  );
};

/**
 * Display a min/max range from v3 field names (e.g. source="volume" → min_volume / max_volume).
 */
const RangeDisplay = ({ source }: FieldProps) => {
  const record = useRecordContext();
  const min = record?.[`min_${source}`];
  const max = record?.[`max_${source}`];
  return (
    <Typography>
      {min} - {max}
    </Typography>
  );
};

export const AudioTrackEdit = (): JSX.Element => {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required disabled />
        <BooleanInput source="is_active" label="Active" />
        <RangeSlider
          minField="min_volume"
          maxField="max_volume"
          label="Volume"
          min={0}
          max={1}
          step={0.1}
          forceMax={1}
        />
        <RangeSlider
          minField="min_duration"
          maxField="max_duration"
          label="Playback Duration (seconds)"
          min={0}
          step={0.1}
        />
        <RangeSlider
          minField="min_dead_air"
          maxField="max_dead_air"
          label="Silence Duration (seconds)"
          min={0}
          step={0.1}
        />
        <RangeSlider
          minField="min_fade_in_time"
          maxField="max_fade_in_time"
          label="Fade In Time (seconds)"
          step={0.1}
          max={10}
        />
        <RangeSlider
          minField="min_fade_out_time"
          maxField="max_fade_out_time"
          label="Fade Out Time (seconds)"
          step={0.1}
          max={10}
        />
        <RangeSlider
          minField="min_pan_pos"
          maxField="max_pan_pos"
          label="Pan Position"
          min={-1}
          max={1}
          step={0.1}
          forceMax={1}
        />
        <RangeSlider
          minField="min_pan_duration"
          maxField="max_pan_duration"
          label="Pan Duration (seconds)"
          step={0.1}
        />
        <NumberInput source="banned_duration" defaultValue={0} />
        <SelectInput
          source="timed_asset_priority"
          choices={[
            { id: "highest", name: "Highest" },
            { id: "normal", name: "Normal" },
            { id: "lowest", name: "Lowest" },
            { id: "discard", name: "Discard" },
          ]}
        />
        <BooleanInput source="repeat_recordings" label="Repeat Recordings" />
        <BooleanInput source="start_with_silence" label="Start With Silence" />
        <BooleanInput
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
      </SimpleForm>
    </Edit>
  );
};

export const AudioTrackCreate = (): JSX.Element => {
  const { selectedProject } = useProjects();

  const transform = (data: RaRecord) => ({
    ...data,
    project_id: selectedProject?.id,
  });

  return (
    <Create redirect="list" transform={transform}>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <BooleanInput source="is_active" label="Active" defaultValue={true} />
        <RangeSlider
          minField="min_volume"
          maxField="max_volume"
          label="Volume"
          min={0}
          max={1}
          step={0.1}
          defaultValue={[0, 1]}
          forceMax={1}
        />
        <RangeSlider
          minField="min_duration"
          maxField="max_duration"
          label="Playback Duration (seconds)"
          step={0.1}
          min={0}
          defaultValue={[0, 100]}
        />
        <RangeSlider
          minField="min_dead_air"
          maxField="max_dead_air"
          label="Silence Duration (seconds)"
          step={0.1}
          min={0}
          defaultValue={[0, 50]}
        />
        <RangeSlider
          minField="min_fade_in_time"
          maxField="max_fade_in_time"
          step={0.1}
          label="Fade In Time (seconds)"
          defaultValue={[0, 5]}
          max={10}
        />
        <RangeSlider
          minField="min_fade_out_time"
          maxField="max_fade_out_time"
          step={0.1}
          label="Fade Out Time (seconds)"
          defaultValue={[0, 5]}
          max={10}
        />
        <RangeSlider
          minField="min_pan_pos"
          maxField="max_pan_pos"
          label="Pan Position"
          min={-1}
          max={1}
          step={0.1}
          defaultValue={[-0.1, 0.1]}
          forceMax={1}
        />
        <RangeSlider
          minField="min_pan_duration"
          maxField="max_pan_duration"
          label="Pan Duration (seconds)"
          step={0.1}
          defaultValue={[0, 60]}
        />
        <NumberInput
          source="banned_duration"
          helperText="Seconds"
          defaultValue={0}
        />
        <SelectInput
          source="timed_asset_priority"
          choices={[
            { id: "highest", name: "Highest" },
            { id: "normal", name: "Normal" },
            { id: "lowest", name: "Lowest" },
            { id: "discard", name: "Discard" },
          ]}
          defaultValue="normal"
        />
        <BooleanInput source="repeat_recordings" label="Repeat Recordings" />
        <BooleanInput source="start_with_silence" label="Start With Silence" />
        <BooleanInput
          source="fadeout_when_filtered"
          label="Fade Out When Filtered"
        />
      </SimpleForm>
    </Create>
  );
};
