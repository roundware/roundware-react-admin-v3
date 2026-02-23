import React from 'react';
import {
  Datagrid,
  DateField,
  DeleteButton,
  List,
  NumberField,
  ReferenceField,
  TextField,
  TextInput,
} from 'react-admin';
import { useProjects } from '../context/ProjectsContext';

export const EventsList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      sort={{ field: 'id', order: 'DESC' }}
      filters={[
        <TextInput key='event_type' source='event_type' label='Event Type' />,
        <TextInput key='session_id' source='session_id' label='Session ID' />,
      ]}
    >
      <Datagrid bulkActionButtons={false}>
        <NumberField source='id' />
        <TextField source='event_type' />
        <ReferenceField source='session_id' reference='sessions'>
          <TextField source='id' />
        </ReferenceField>
        <NumberField source='latitude' />
        <NumberField source='longitude' />
        <TextField source='tags' />
        <DateField source='server_time' showTime />
        <TextField source='client_time' />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

// Events are append-only log entries — no create or edit form.
// Kept as named exports to satisfy App.tsx imports if needed.
export const EventsEdit = EventsList;
export const EventsCreate = EventsList;
