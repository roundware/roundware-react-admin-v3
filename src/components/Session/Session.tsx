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

export const SessionList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List filter={{ project_id: selectedProject?.id }}>
      <Datagrid>
        <SessionMapLink />
        <NumberField source="id" />
        <TextField source="device_id" />
        <DateField source="starttime" showTime />
        <DateField source="stoptime" showTime />
        <TextField source="client_type" />
        <TextField source="client_system" />
        <BooleanField source="demo_stream_enabled" />
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
    <Link to={`/project/${pc.selectedProject?.id}/session_map/${record.id}`}>
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
        <TextInput source="device" required />
        <DateTimeInput source="starttime" required />
        <DateTimeInput source="stoptime" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="demo_stream_enabled" />
        <BooleanInput source="geo_listen_enabled" />
        <TextInput source="timezone" />
        <ReferenceInput source="project_id" reference="projects" required>
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
        <TextInput source="id" required />
        <TextInput source="device" required />
        <DateTimeInput source="starttime" required defaultValue={new Date()} />
        <DateTimeInput source="stoptime" />
        <TextInput source="client_type" />
        <TextInput source="client_system" />
        <BooleanInput source="demo_stream_enabled" />
        <BooleanInput source="geo_listen_enabled" />
        <TextInput source="timezone" />
      </SimpleForm>
    </Create>
  );
};
