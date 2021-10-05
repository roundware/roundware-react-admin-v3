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

export const LanguageList = (props: ListProps) => {
  return (
    <List {...props}>
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
