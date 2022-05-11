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
  TextField,
  Record,
} from "react-admin";
import { useProjects } from "../providers/ProjectsContext";
export const UserList = (props: ListProps): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid rowClick={"edit"}>
        <TextField source="id" />
        <TextField source="username" />
        <TextField source="first_name" />
        <TextField source="last_name" />
        <TextField source="email" />
        <TextField source="device_id" />
        <TextField source="client_type" />
      </Datagrid>
    </List>
  );
};

export const UserEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit>
      <SimpleForm
        warnWhenUnsavedChanges
        transform={(r: Record) => {
          if (!r.device_id) {
            delete r.device_id;
          }
          return r;
        }}
      >
        <TextInput source="id" disabled />
        <TextInput source="username" />
        <TextInput source="fist_name" />
        <TextInput source="last_name" />
        <TextInput source="email" />
        {/* <TextInput source="device_id" defaultValue="" /> */}
        {/* <TextInput source="client_type" /> */}
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm
        transform={(r: Record) => {
          if (!r.device_id) {
            delete r.device_id;
          }
          return r;
        }}
        warnWhenUnsavedChanges
      >
        <TextInput source="username" />
        <TextInput source="first_name" />
        <TextInput source="last_name" />
        <TextInput source="email" />
        {/* <TextInput source="device_id" defaultValue="" /> */}
        {/* <TextInput source="client_type" /> */}
      </SimpleForm>
    </Create>
  );
};
