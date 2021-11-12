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
import { useSpeakers } from "providers/SpeakersContext";
import SpeakerAudioControls from "./SpeakerAudioControls";

export const SpeakerEdit = (props: EditProps): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData } = useSpeakers();

  const transform = (data: Record) => {
    data.project = selectedProject?.id;
    if (typeof data?.file?.src == "string") {
      data.file = data.file.rawFile;
      delete data.uri;
      delete data.backupuri;
    } else delete data?.file;
    return data;
  };

  return (
    <Edit
      {...props}
      mutationMode="optimistic"
      onSuccess={fetchData}
      transform={transform}
    >
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
          defaultValue={selectedProject?.id}
          reference="projects"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (props: CreateProps): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData } = useSpeakers();
  const transform = (data: Record) => {
    data.project = selectedProject?.id;
    if (typeof data?.file?.src == "string") {
      data.file = data.file.rawFile;
      delete data.uri;
      delete data.backupuri;
    } else delete data?.file;
    return data;
  };
  return (
    <Create {...props} transform={transform} onSuccess={fetchData}>
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
