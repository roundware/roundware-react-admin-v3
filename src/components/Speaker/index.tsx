import React from "react";
import {
  BooleanInput,
  Create,
  CreateProps,
  Edit,
  EditProps,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  Record,
} from "react-admin";
import { useProjects } from "providers/ProjectsContext";
import SpeakerAudioControls from "./SpeakerAudioControls";

export const SpeakerEdit = (props: EditProps) => {
  const { selectedProject } = useProjects();
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" fullWidth />
        <BooleanInput source="activeyn" fullWidth />
        <TextInput source="code" fullWidth />
        <SpeakerAudioControls />
        <TextInput source="uri" fullWidth />
        <TextInput source="backupuri" fullWidth />

        <NumberInput source="attenuation_distance" required fullWidth />

        <ReferenceInput
          source="project_id"
          defaultValue={selectedProject!.id}
          reference="projects"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (props: CreateProps) => {
  const { selectedProject } = useProjects();
  const transform = (data: Record) => {
    data.project = selectedProject!.id;
    if (typeof data?.file?.src == "string") {
      data.file = data.file.rawFile;
      delete data.uri;
      delete data.backupuri;
    }
    return data;
  };
  return (
    <Create {...props} transform={transform}>
      <SimpleForm>
        <BooleanInput source="activeyn" fullWidth defaultChecked />
        <TextInput source="code" fullWidth required />

        <SpeakerAudioControls />
        <NumberInput
          source="attenuation_distance"
          fullWidth
          helperText="Meters"
        />
      </SimpleForm>
    </Create>
  );
};
