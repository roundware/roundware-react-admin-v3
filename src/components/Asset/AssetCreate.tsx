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
  FileInput,
  FileField,
  DateTimeInput,
  CreateProps,
  Record,
} from "react-admin";

import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import { useProjects } from "../../providers/ProjectsContext";
import { FileEdit } from "../common/FileEdit";
import AudioOptions from "../common/AudioOptions";
import LocationSelector from "components/common/LocationSelector";
const AssetCreate = (props: CreateProps) => {
  const transform = (data: Record) => {
    data.file = data.file.rawFile;
    data.session_id = 1;
    return data;
  };

  const { selectedProject } = useProjects();
  return (
    <Create title="Create an asset" {...props} transform={transform}>
      <SimpleForm>
        <TextInput source="id" disabled />
        {/* <ReferenceInput
          label="Project"
          source="project_id"
          reference="projects"
          defaultValue={selectedProject?.id}
        >
          <SelectInput source="name" />
        </ReferenceInput> */}

        {/* <ReferenceInput label="User" source="user.id" reference="users">
          <SelectInput source="user.id" />
        </ReferenceInput> */}
        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
          ]}
          defaultValue="audio"
        />

        <AudioOptions />
        <LocationSelector
          fieldNames={{ latitude: `latitude`, longitude: `longitude` }}
        />

        <TextInput multiline source="description" fullWidth minRows={2} />
        <NumberInput source="latitude" />
        <NumberInput source="longitude" />
        <DateTimeInput source="created" />
        <DateTimeInput source="updated" />
        <BooleanInput source="submitted" />
        <NumberInput source="volume" />
        <NumberInput source="weight" />

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
