import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  ReferenceArrayInput,
  SelectArrayInput,
  DateInput,
  FileInput,
  FileField,
  DateTimeInput,
  CreateProps,
} from "react-admin";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import { dateFormatter } from "../../utils";

const AssetCreate = (props: CreateProps) => {
  return (
    <Create title="Create an asset" {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <ReferenceInput
          label="Project"
          source="project_id"
          reference="projects"
        >
          <SelectInput source="name" />
        </ReferenceInput>
        <ReferenceInput label="User" source="user.id" reference="users">
          <SelectInput source="user.username" />
        </ReferenceInput>
        <FileInput source="file" label="Asset File" accept="audio/mpeg">
          <FileField source="file" title="title" />
        </FileInput>
        <NumberInput source="session_id" />
        <TextInput multiline source="description" fullWidth />
        <NumberInput source="latitude" />
        <NumberInput source="longitude" />
        <DateTimeInput source="created" />
        <DateTimeInput source="updated" />
        <BooleanInput source="submitted" />
        <NumberInput source="volume" />
        <NumberInput source="weight" />
        <NumberInput source="start_time" />
        <NumberInput source="end_time" />
        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
        >
          <SelectInput source="name" />
        </ReferenceInput>
        <ReferenceArrayInput source="tag_ids" reference="tags" fullWidth>
          <SelectArrayInput optionText="description" />
        </ReferenceArrayInput>

        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            { id: "video", name: "video" },
          ]}
        />
        <NumberInput label="Audio Length(s)" source="audio_length_in_seconds" />
        <Divider />
        <ReferenceArrayInput
          source="description_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" />
        </ReferenceArrayInput>
        <ReferenceArrayInput
          source="alt_text_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" />
        </ReferenceArrayInput>
        <NumberInput source="envelope_ids" disabled />
      </SimpleForm>
    </Create>
  );
};

export default AssetCreate;
