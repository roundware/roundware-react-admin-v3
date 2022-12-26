import Search from '@mui/icons-material/Search';
import React from 'react';
import {
  Create,
  Datagrid,
  Edit,
  List,
  RaRecord,
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
          source='search_str'
          label='Search'
          key={'search_str'}
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
        <TextField source='username' />
        <TextField source='first_name' />
        <TextField source='last_name' />
        <TextField source='email' />
        <TextField source='device_id' />
        <TextField source='client_type' />
      </Datagrid>
    </List>
  );
};

export const UserEdit = (): JSX.Element => {
  return (
    <Edit
      transform={(r: RaRecord) => {
        if (!r.device_id) {
          delete r.device_id;
        }
        return r;
      }}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='id' disabled />
        <TextInput source='username' />
        <TextInput source='fist_name' />
        <TextInput source='last_name' />
        <TextInput source='email' />
        {/* <TextInput source="device_id" defaultValue="" /> */}
        {/* <TextInput source="client_type" /> */}
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = (): JSX.Element => {
  return (
    <Create
      transform={(r: RaRecord) => {
        if (!r.device_id) {
          delete r.device_id;
        }
        return r;
      }}
      redirect='list'
    >
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source='username' />
        <TextInput source='first_name' />
        <TextInput source='last_name' />
        <TextInput source='email' />
        {/* <TextInput source="device_id" defaultValue="" /> */}
        {/* <TextInput source="client_type" /> */}
      </SimpleForm>
    </Create>
  );
};
