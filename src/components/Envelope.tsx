import React from 'react';
import {
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
} from 'react-admin';
import { useProjects } from '../context/ProjectsContext';
import FormToolbar from './common/FormToolbar';

export const EnvelopeList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      sort={{ field: 'id', order: 'DESC' }}
    >
      <Datagrid rowClick='edit'>
        <NumberField source='id' />
        <ReferenceField source='session_id' reference='sessions'>
          <TextField source='id' />
        </ReferenceField>
        <DateField source='created_at' showTime />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const EnvelopeEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <NumberField source='id' />
        <ReferenceInput source='session_id' reference='sessions'>
          <SelectInput optionText='id' />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const EnvelopeCreate = (): JSX.Element => {
  return (
    <Create redirect='list'>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ReferenceInput source='session_id' reference='sessions'>
          <SelectInput optionText='id' required />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};
