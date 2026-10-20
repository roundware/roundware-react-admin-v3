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

// v3's names (server listening_history): started_at, duration_sec,
// session_id, asset_id or speaker_id. The forms used v2's (starttime,
// duration_in_seconds, session, asset), which the server doesn't know.

/** Only the duration can change after the fact; the rest is shown. */
export const ListenEventsEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <DateTimeInput source="started_at" label="Started" disabled />
        <NumberInput source="duration_sec" label="Seconds" />
        <ReferenceInput source="session_id" reference="sessions">
          <SelectInput optionText="id" disabled />
        </ReferenceInput>
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText="id" label="Contribution" disabled />
        </ReferenceInput>
        <ReferenceInput source="speaker_id" reference="speakers">
          <SelectInput optionText="code" label="Speaker" disabled />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

/** What was heard — a contribution or a speaker, one of them — and when. */
export const ListenEventsCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ReferenceInput source="session_id" reference="sessions">
          <SelectInput optionText="id" required />
        </ReferenceInput>
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText="id" label="Contribution" helperText="Or a speaker below — one of them." />
        </ReferenceInput>
        <ReferenceInput source="speaker_id" reference="speakers">
          <SelectInput optionText="code" label="Speaker" />
        </ReferenceInput>
        <DateTimeInput source="started_at" label="Started" required />
        <NumberInput source="duration_sec" label="Seconds" />
      </SimpleForm>
    </Create>
  );
};
