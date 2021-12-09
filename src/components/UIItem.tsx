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

export const UiItemList = (props: ListProps): JSX.Element => {
  return (
    <List {...props}>
      <Datagrid></Datagrid>
    </List>
  );
};

export const UiItemEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
