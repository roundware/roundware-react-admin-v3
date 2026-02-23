import React from 'react';
import {
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  SimpleForm,
  TextField,
  TextInput,
} from 'react-admin';
import FormToolbar from './common/FormToolbar';

export const LanguageList = (): JSX.Element => {
  return (
    <List>
      <Datagrid rowClick='edit'>
        <NumberField source='id' />
        <TextField source='name' />
        <TextField source='language_code' />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const LanguageEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='id' disabled />
        <TextInput source='name' required />
        <TextInput source='language_code' required />
      </SimpleForm>
    </Edit>
  );
};

export const LanguageCreate = (): JSX.Element => {
  return (
    <Create redirect='list'>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source='name' required />
        <TextInput source='language_code' required />
      </SimpleForm>
    </Create>
  );
};
