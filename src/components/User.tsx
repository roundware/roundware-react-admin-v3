import Search from '@mui/icons-material/Search';
import React from 'react';
import {
  Create,
  Datagrid,
  Edit,
  List,
  PasswordInput,
  RaRecord,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from 'react-admin';
import { useProjects } from '../context/ProjectsContext';

export const UserList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      filters={[
        <TextInput
          alwaysOn
          source='search'
          label='Search'
          key={'search'}
          InputProps={{
            endAdornment: <Search />,
          }}
        />,
      ]}
      sx={{
        my: 2,
      }}
    >
      <Datagrid rowClick={'edit'}>
        <TextField source='id' />
        <TextField source='first_name' />
        <TextField source='last_name' />
        <TextField source='email' />
        <TextField source='role' />
      </Datagrid>
    </List>
  );
};

export const UserEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='id' disabled />
        <TextInput source='first_name' />
        <TextInput source='last_name' />
        <TextInput source='email' />
        <SelectInput
          source='role'
          choices={[
            { id: 'owner', name: 'Owner' },
            { id: 'admin', name: 'Admin' },
            { id: 'editor', name: 'Editor' },
            { id: 'viewer', name: 'Viewer' },
          ]}
        />
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (): JSX.Element => {
  return (
    <Create redirect='list'>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='first_name' />
        <TextInput source='last_name' />
        <TextInput source='email' />
        <PasswordInput source='password' />
        <SelectInput
          source='role'
          choices={[
            { id: 'viewer', name: 'Viewer' },
            { id: 'editor', name: 'Editor' },
            { id: 'admin', name: 'Admin' },
            { id: 'owner', name: 'Owner' },
          ]}
          defaultValue='viewer'
        />
      </SimpleForm>
    </Create>
  );
};
