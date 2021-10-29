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
} from "react-admin";
import SpeakerAudioControls from "./SpeakerAudioControls";

export const SpeakerEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" fullWidth />
        <BooleanInput source="activeyn" fullWidth />
        <TextInput source="code" fullWidth />
        <SpeakerAudioControls />
        <TextInput source="uri" fullWidth />
        <TextInput source="backupuri" fullWidth />
        <TextInput source="shape.type" fullWidth />
        <TextInput source="boundary.type" fullWidth />
        <NumberInput source="attenuation_distance" fullWidth />
        <TextInput source="attenuation_border.type" fullWidth />
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <BooleanInput source="activeyn" fullWidth />
        <TextInput source="code" fullWidth required />
        {/* <SpeakerAudioControls /> */}
        <TextInput source="uri" fullWidth required />
        <TextInput source="backupuri" fullWidth />

        <NumberInput source="attenuation_distance" fullWidth />
        <TextInput source="attenuation_border.type" fullWidth />
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};
