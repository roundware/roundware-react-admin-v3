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

export const SessionList = (props: ListProps) => {
  return (
    <List {...props}>
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
        <ReferenceField source="project_id" reference="projects">
          <TextField source="name" />
        </ReferenceField>
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const SessionEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm>
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
      <SimpleForm>
        <TextInput source="id" required />
        <TextInput source="device" required />
        <DateTimeInput source="starttime" required defaultValue={new Date()} />
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
    </Create>
  );
};
