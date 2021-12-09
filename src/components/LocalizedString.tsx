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

export const LocalizedStringList = (props: ListProps): JSX.Element => {
  return (
    <List {...props}>
      <Datagrid rowClick="edit"></Datagrid>
    </List>
  );
};

export const LocalizedStringEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const LocalizedStringCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
