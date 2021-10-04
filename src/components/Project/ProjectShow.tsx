import {
  Show,
  ShowProps,
  SimpleShowLayout,
  TextField,
  DateField,
  NumberField,
  BooleanField,
  ReferenceArrayField,
} from "react-admin";
import React from "react";
import { Typography } from "@material-ui/core";

interface Props extends ShowProps {}

const ProjectShow = (props: Props) => {
  return (
    <Show {...props} title="Project Details">
      <SimpleShowLayout>
        <Typography variant="h5">Project Details</Typography>
        <TextField source="id" />
        <TextField source="name" />
        <DateField source="owner" />
        <NumberField source="latitude" />
        <NumberField source="longitude" />
        <DateField source="pub_date" />
        <TextField source="audio_format" />
        <BooleanField source="auto_submit" />
        <NumberField source="max_recording_length" />
        <BooleanField source="listen_questions_dynamic" />
        <BooleanField source="speak_questions_dynamic" />
        <TextField source="sharing_url" />
        <TextField source="out_of_range_url" />
        <NumberField source="recording_radius" />
        <BooleanField source="listen_enabled" />
        <BooleanField source="geo_listen_enabled" />
        <BooleanField source="speak_enabled" />
        <BooleanField source="geo_speak_enabled" />
        <BooleanField source="reset_tag_defaults_on_startup" />
        <BooleanField source="timed_asset_priority" />
        <TextField source="repeat_mode" />
        <TextField source="files_url" />
        <TextField source="files_version" />
        <TextField source="audio_stream_bitrate" />
        <TextField source="ordering" />
        <BooleanField source="demo_stream_enabled" />
        <TextField source="demo_stream_url" />
        <NumberField source="out_of_range_distance" />
        <TextField source="demo_stream_message" />
        <TextField source="legal_agreement" />
        <TextField source="description" />
        <TextField source="sharing_message" />
        <TextField source="out_of_range_message" />
        <ReferenceArrayField source="language_ids" reference="languages">
          <TextField source="id" />
        </ReferenceArrayField>
      </SimpleShowLayout>
    </Show>
  );
};

export default ProjectShow;
