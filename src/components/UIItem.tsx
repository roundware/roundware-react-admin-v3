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

export const UserCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
