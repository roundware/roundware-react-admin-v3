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
import FormToolbar from "./common/FormToolbar";
export const EnvelopeList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid rowClick="edit"></Datagrid>
    </List>
  );
};

export const EnvelopeEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const EnvelopeCreate = (): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
