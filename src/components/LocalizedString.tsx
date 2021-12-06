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

export const LocalizedStringList = (props: ListProps) => {
  return (
    <List {...props}>
      <Datagrid></Datagrid>
    </List>
  );
};

export const LocalizedStringEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const LocalizedStringCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
