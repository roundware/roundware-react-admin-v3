import React from "react";
import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";
import { useProjects } from "../context/ProjectsContext";
import CopyResourceButton from "./common/CopyResource";
import FormToolbar from "./common/FormToolbar";

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
        <SelectInput
          key="kind"
          source="kind"
          label="Heard"
          choices={[
            { id: "asset", name: "Contributions" },
            { id: "speaker", name: "Speakers" },
          ]}
        />,
      ]}
    >
      {/* What a session heard: a contribution or a speaker, from when, for
          how long, and where the listener was (server docs/010). */}
      <Datagrid rowClick="edit">
        <NumberField source="id" />
        <DateField source="started_at" label="Started" showTime />
        <NumberField source="duration_sec" label="Seconds" options={{ maximumFractionDigits: 1 }} />
        <ReferenceField source="session_id" reference="sessions">
          <TextField source="id" />
        </ReferenceField>
        <ReferenceField source="asset_id" reference="assets" label="Contribution" emptyText="">
          <TextField source="id" />
        </ReferenceField>
        <ReferenceField source="speaker_id" reference="speakers" label="Speaker" emptyText="">
          <TextField source="code" />
        </ReferenceField>
        <NumberField source="latitude" options={{ maximumFractionDigits: 5 }} />
        <NumberField source="longitude" options={{ maximumFractionDigits: 5 }} />
        <EditButton />
        <DeleteButton />
        <CopyResourceButton />
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

export const ListenEventsCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
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
