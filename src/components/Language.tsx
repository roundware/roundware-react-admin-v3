import {
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextInput,
} from "react-admin";

import { useProjects } from "../context/ProjectsContext";
import FormToolbar from "./common/FormToolbar";
export const LanguageList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid rowClick="edit"></Datagrid>
    </List>
  );
};

export const LanguageEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const LanguageCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
