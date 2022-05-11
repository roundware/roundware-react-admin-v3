import React from "react";
import {
  Create,
  CreateProps,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  Edit,
  EditButton,
  EditProps,
  List,
  ListProps,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";
import { useProjects } from "../providers/ProjectsContext";

export const ListenEventsList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      filters={[
        <DateTimeInput
          key="startgte"
          source="start_time__gte"
          label="Started After"
        />,
        <DateTimeInput
          key="startlte"
          source="start_time__lte"
          label="Started Before"
        />,
        <ReferenceInput source="asset_id" reference="assets" key="asset_id">
          <SelectInput optionText="id" />
        </ReferenceInput>,
      ]}
    >
      <Datagrid rowClick="edit">
        <NumberField source="id" />
        <NumberField source="duration_in_seconds" />
        <DateField source="start_time" />
        <ReferenceField source="session_id" reference="sessions">
          <TextField source="id" />
        </ReferenceField>
        <ReferenceField source="asset_id" reference="assets">
          <TextField source="filename" />
        </ReferenceField>
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const ListenEventsEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <NumberInput source="duration_in_seconds" />
        <DateTimeInput source="starttime" label="Start Time" />
        <ReferenceInput source="session" reference="sessions">
          <SelectInput optionText="id" />
        </ReferenceInput>
        <ReferenceInput source="asset" reference="assets">
          <SelectInput optionText="id" />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const ListenEventsCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <NumberInput source="duration_in_seconds" required />
        <DateTimeInput source="starttime" label="Start Time" required />
        <ReferenceInput source="session" reference="sessions">
          <SelectInput optionText="id" required />
        </ReferenceInput>
        <ReferenceInput source="asset" reference="assets">
          <SelectInput optionText="id" required />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};
