import React from "react";
import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
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
} from "react-admin";
import FormToolbar from "./common/FormToolbar";

export const NotificationList = (): JSX.Element => {
  return (
    <List>
      <Datagrid rowClick="edit">
        <NumberField source="id" />
        <NumberField source="project_id" />
        <BooleanField source="is_active" />
        <BooleanField source="on_create" />
        <BooleanField source="on_edit" />
        <BooleanField source="on_delete" />
        <TextField source="subject_template" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const NotificationEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" disabled />
        </ReferenceInput>
        <BooleanInput source="is_active" />
        <BooleanInput source="on_create" />
        <BooleanInput source="on_edit" />
        <BooleanInput source="on_delete" />
        <TextInput source="subject_template" fullWidth />
        <TextInput source="message_template" multiline fullWidth rows={6} />
      </SimpleForm>
    </Edit>
  );
};

export const NotificationCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" required />
        </ReferenceInput>
        <BooleanInput source="is_active" defaultValue={true} />
        <BooleanInput source="on_create" defaultValue={true} />
        <BooleanInput source="on_edit" />
        <BooleanInput source="on_delete" />
        <TextInput source="subject_template" fullWidth />
        <TextInput source="message_template" multiline fullWidth rows={6} />
      </SimpleForm>
    </Create>
  );
};
