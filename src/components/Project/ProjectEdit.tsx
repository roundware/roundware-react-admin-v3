import React from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  ReferenceArrayInput,
  SelectArrayInput,
  DateTimeInput,
  EditProps,
} from "react-admin";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";

const ProjectEdit = (props: EditProps) => {
  return (
    <Edit title="Edit a project" {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <TextInput source="name" fullWidth />
        <TextInput multiline source="description" fullWidth />
        <NumberInput source="latitude" />
        <NumberInput source="longitude" />
        <DateTimeInput source="pub_date" />
        <BooleanInput source="auto_submit" />
        <NumberInput source="max_recording_length" />
        <TextInput source="sharing_url" fullWidth />
        <NumberInput source="recording_radius" />
        <BooleanInput source="listen_enabled" />
        <BooleanInput source="geo_listen_enabled" />
        <BooleanInput source="speak_enabled" />
        <BooleanInput source="geo_speak_enabled" />
        <BooleanInput source="reset_tag_defaults_on_startup" />
        <BooleanInput source="timed_asset_priority" />
        <ReferenceArrayInput source="language_ids" reference="languages">
          <SelectArrayInput optionText="name" />
        </ReferenceArrayInput>
        <SelectInput
          source="repeat_mode"
          choices={[
            { id: "stop", name: "stop" },
            { id: "continuous", name: "continuous" },
          ]}
        />
        <SelectInput
          source="ordering"
          choices={[
            { id: "by_like", name: "by_like" },
            { id: "by_weight", name: "by_weight" },
            { id: "random", name: "random" },
          ]}
        />
        <BooleanInput source="listen_questions_dynamic" />
        <BooleanInput source="speak_questions_dynamic" />
        <Divider />
        <Typography variant={"h6"} gutterBottom>
          Secondary Settings
        </Typography>
        <NumberInput source="out_of_range_distance" />
        <TextInput source="out_of_range_url" fullWidth />
        <BooleanInput source="demo_stream_enabled" />
        <TextInput source="demo_stream_message" fullWidth />
        <TextInput source="demo_stream_url" fullWidth />
        <TextInput source="audio_format" />
        <TextInput source="files_url" fullWidth />
        <SelectInput
          source="audio_stream_bitrate"
          choices={[
            { id: "64", name: "64" },
            { id: "96", name: "96" },
            { id: "112", name: "112" },
            { id: "128", name: "128" },
            { id: "160", name: "160" },
            { id: "192", name: "192" },
            { id: "256", name: "256" },
            { id: "320", name: "320" },
          ]}
        />
      </SimpleForm>
    </Edit>
  );
};

export default ProjectEdit;
