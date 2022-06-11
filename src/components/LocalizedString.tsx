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
import FormToolbar from "./common/FormToolbar";

export const LocalizedStringList = (): JSX.Element => {
  return (
    <List>
      <Datagrid rowClick="edit"></Datagrid>
    </List>
  );
};

export const LocalizedStringEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const LocalizedStringCreate = (): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
