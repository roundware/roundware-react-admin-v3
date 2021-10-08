import React from "react";
import {
  CreateProps,
  ListProps,
  EditProps,
  List,
  Create,
  Edit,
  Datagrid,
  SimpleForm,
  TextInput,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  NumberInput,
  DateTimeInput,
  ReferenceInput,
  SelectInput,
  EditButton,
  DeleteButton,
  ShowButton,
} from "react-admin";
import { dateFormatter } from "../utils";

export const ListenEventsList = (props: ListProps) => {
  return (
    <List {...props}>
      <Datagrid>
        <NumberField source="id" />
        <NumberField source="duration_in_seconds" />
        <DateField source="start_time" />
        <ReferenceField source="session_id" reference="sessions">
          <TextField source="id" />
        </ReferenceField>
        <ReferenceField source="asset_id" reference="assets">
          <TextField source="filename" />
        </ReferenceField>
        <EditButton basePath="/assets" />
        <DeleteButton basePath="/assets" />
      </Datagrid>
    </List>
  );
};

export const ListenEventsEdit = (props: EditProps) => {
  return (
    <Edit {...props}>
      <SimpleForm>
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

export const ListenEventsCreate = (props: CreateProps) => {
  return (
    <Create {...props}>
      <SimpleForm>
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
