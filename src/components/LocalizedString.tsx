import React from 'react';
import { Link } from 'react-router-dom';
import {
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  ReferenceField,
  ReferenceInput,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useRecordContext,
} from 'react-admin';
import FormToolbar from './common/FormToolbar';

/** Maps entity_type values to React Admin resource names */
const ENTITY_RESOURCE_MAP: Record<string, string> = {
  project: 'projects',
  tag: 'tags',
  ui_group: 'uigroups',
  asset: 'assets',
};

/** Renders entity_id as a clickable link to the entity's edit page */
const EntityIdLink = (_props: { label?: string }) => {
  const record = useRecordContext();
  if (!record) return null;
  const { entity_type, entity_id } = record;
  const resource = ENTITY_RESOURCE_MAP[entity_type as string];
  if (!resource || entity_id == null) {
    return <span>{String(entity_id ?? '')}</span>;
  }
  return (
    <Link
      to={`/${resource}/${entity_id}`}
      onClick={(e) => e.stopPropagation()}
      style={{ color: '#1976d2', textDecoration: 'none' }}
    >
      {String(entity_id)}
    </Link>
  );
};

const localizedStringFilters = [
  <SearchInput source="search" alwaysOn key="search" />,
  <SelectInput
    source="entity_type"
    key="entity_type"
    choices={[
      { id: 'project', name: 'Project' },
      { id: 'tag', name: 'Tag' },
      { id: 'ui_group', name: 'UI Group' },
      { id: 'asset', name: 'Asset' },
    ]}
    alwaysOn
  />,
  <ReferenceInput source="language_id" reference="languages" key="language_id">
    <SelectInput optionText="language_code" />
  </ReferenceInput>,
  <TextInput source="entity_id" key="entity_id" />,
];

export const LocalizedStringList = (): JSX.Element => {
  return (
    <List filters={localizedStringFilters}>
      <Datagrid rowClick="edit">
        <TextField source="id" label="ID" />
        <TextField source="entity_type" />
        <EntityIdLink label="Entity ID" />
        <ReferenceField source="language_id" reference="languages">
          <TextField source="language_code" />
        </ReferenceField>
        <TextField source="field_name" />
        <TextField source="localized_text" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const LocalizedStringEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <TextInput source="entity_type" disabled />
        <TextInput source="entity_id" disabled />
        <ReferenceInput source="language_id" reference="languages">
          <SelectInput optionText="language_code" />
        </ReferenceInput>
        <TextInput source="field_name" disabled />
        <TextInput source="localized_text" multiline required fullWidth rows={4} />
      </SimpleForm>
    </Edit>
  );
};

export const LocalizedStringCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <SelectInput
          source="entity_type"
          required
          choices={[
            { id: 'project', name: 'Project' },
            { id: 'tag', name: 'Tag' },
            { id: 'ui_group', name: 'UI Group' },
            { id: 'asset', name: 'Asset' },
          ]}
        />
        <TextInput source="entity_id" required />
        <ReferenceInput source="language_id" reference="languages">
          <SelectInput optionText="language_code" required />
        </ReferenceInput>
        <TextInput source="field_name" required />
        <TextInput source="localized_text" multiline required fullWidth rows={4} />
      </SimpleForm>
    </Create>
  );
};
