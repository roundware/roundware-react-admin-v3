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

export const UiItemList = (props: ListProps) => {
  return (
    <List {...props}>
      <Datagrid></Datagrid>
    </List>
  );
};

export const UiItemEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
