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
} from "react-admin";
import { useProjects } from "../providers/ProjectsContext";
export const EnvelopeList = (props: ListProps): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid rowClick="edit"></Datagrid>
    </List>
  );
};

export const EnvelopeEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const EnvelopeCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
