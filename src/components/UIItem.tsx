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

export const UiItemList = (): JSX.Element => {
  return (
    <List>
      <Datagrid></Datagrid>
    </List>
  );
};

export const UiItemEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
