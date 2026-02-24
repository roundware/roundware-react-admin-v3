import React from 'react';
import {
  ArrayField,
  BooleanField,
  BooleanInput,
  ChipField,
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  SimpleForm,
  SingleFieldList,
  TextField,
  TextInput,
} from 'react-admin';
import FormToolbar from './common/FormToolbar';

export const TenantList = (): JSX.Element => {
  return (
    <List sort={{ field: 'id', order: 'ASC' }}>
      <Datagrid rowClick='edit'>
        <NumberField source='id' />
        <TextField source='name' />
        <TextField source='slug' />
        <BooleanField source='is_active' />
        <ArrayField source='members'>
          <SingleFieldList linkType={false}>
            <ChipField source='email' size='small' />
          </SingleFieldList>
        </ArrayField>
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const TenantEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='id' disabled />
        <TextInput source='name' required />
        <TextInput source='slug' required helperText='Used as subdomain and X-Tenant-Slug header' />
        <BooleanInput source='is_active' />
      </SimpleForm>
    </Edit>
  );
};

export const TenantCreate = (): JSX.Element => {
  return (
    <Create redirect='list'>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source='name' required />
        <TextInput source='slug' required helperText='Used as subdomain and X-Tenant-Slug header' />
        <TextInput
          source='owner_email'
          required
          helperText='Email of an existing user to assign as owner'
        />
        <BooleanInput source='is_active' defaultValue={true} />
      </SimpleForm>
    </Create>
  );
};
