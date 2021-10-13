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
export const LanguageList = (props: ListProps) => {
  const { selectedProject } = useProjects();
  return (
    <List {...props} filter={{ project_id: selectedProject?.id }}>
      <Datagrid></Datagrid>
    </List>
  );
};

export const LanguageEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const LanguageCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
