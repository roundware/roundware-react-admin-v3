import { Map } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";
import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  Edit,
  EditButton,
  FunctionField,
  List,
  NumberField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useRecordContext,
} from "react-admin";
import { Link } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import FormToolbar from "../common/FormToolbar";
import { ParticipantLink, RecordParticipant, useCanSeeParticipants } from "../../pages/Participants";

export const SessionList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const can = useCanSeeParticipants();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid>
        <SessionMapLink />
        <NumberField source="id" />
        <TextField source="device_id" />
        {can && (
          <FunctionField
            label="Participant"
            sortBy="participant_id"
            render={(r: { participant_id?: number | null }) => <ParticipantLink id={r?.participant_id} />}
          />
        )}
        <DateField source="started_at" showTime />
        <DateField source="stopped_at" showTime />
        <TextField source="client_type" />
        <TextField source="client_system" />
        <BooleanField source="geo_listen_enabled" />
        <TextField source="timezone" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

const SessionMapLink = () => {
  const record = useRecordContext();
  const pc = useProjects();
  return (
    <Link to={`/project/${pc.selectedProject?.id}/session_map/${record?.id}`}>
      <IconButton>
        <Map />
      </IconButton>
    </Link>
  );
};

export const SessionEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <RecordParticipant />
        <TextInput source="device_id" />
        <DateTimeInput source="started_at" />
        <DateTimeInput source="stopped_at" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="geo_listen_enabled" />
        <TextInput source="timezone" />
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export const SessionCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" required />
        </ReferenceInput>
        <TextInput source="device_id" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="geo_listen_enabled" defaultValue={true} />
        <TextInput source="timezone" defaultValue="0000" />
      </SimpleForm>
    </Create>
  );
};
