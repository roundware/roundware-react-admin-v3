import React from "react";
import {
  CreateProps,
  ListProps,
  EditProps,
  List,
  Create,
  Edit,
  Datagrid,
  SimpleForm,
  TextInput,
  NumberField,
  TextField,
  DateField,
  BooleanField,
  ReferenceField,
  DateTimeInput,
  BooleanInput,
  ReferenceInput,
  SelectInput,
  EditButton,
  DeleteButton,
} from "react-admin";
import { useProjects } from "../providers/ProjectsContext";

export const SessionList = (props: ListProps) => {
  const { selectedProject } = useProjects();
  return (
    <List {...props} filter={{ project_id: selectedProject?.id }}>
      <Datagrid>
        <NumberField source="id" />
        <TextField source="device_id" />
        <DateField source="starttime" showTime />
        <DateField source="stoptime" showTime />
        <TextField source="client_type" />
        <TextField source="client_system" />
        <BooleanField source="demo_stream_enabled" />
        <BooleanField source="geo_listen_enabled" />
        <TextField source="timezone" />

        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const SessionEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <TextInput source="device" required />
        <DateTimeInput source="starttime" required />
        <DateTimeInput source="stoptime" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="demo_stream_enabled" />
        <BooleanInput source="geo_listen_enabled" />
        <TextInput source="timezone" />
        <ReferenceInput source="project_id" reference="projects" required>
          <SelectInput source="name" />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const SessionCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
        <TextInput source="device" required />
        <DateTimeInput source="starttime" required defaultValue={new Date()} />
        <DateTimeInput source="stoptime" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="demo_stream_enabled" />
        <BooleanInput source="geo_listen_enabled" />
        <TextInput source="timezone" />
      </SimpleForm>
    </Create>
  );
};
