import React from 'react';
import {
  Create,
  Datagrid,
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
  TextInput,
} from 'react-admin';
import FormToolbar from './common/FormToolbar';

export const LocalizedStringList = (): JSX.Element => {
  return (
    <List>
      <Datagrid rowClick='edit'>
        <NumberField source='id' />
        <TextField source='entity_type' />
        <NumberField source='entity_id' />
        <ReferenceField source='language_id' reference='languages'>
          <TextField source='language_code' />
        </ReferenceField>
        <TextField source='field_name' />
        <TextField source='localized_text' />
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
        <TextInput source='id' disabled />
        <TextInput source='entity_type' disabled />
        <TextInput source='entity_id' disabled />
        <ReferenceInput source='language_id' reference='languages'>
          <SelectInput optionText='language_code' />
        </ReferenceInput>
        <TextInput source='field_name' disabled />
        <TextInput source='localized_text' multiline required />
      </SimpleForm>
    </Edit>
  );
};

export const LocalizedStringCreate = (): JSX.Element => {
  return (
    <Create redirect='list'>
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <SelectInput
          source='entity_type'
          required
          choices={[
            { id: 'project', name: 'Project' },
            { id: 'tag', name: 'Tag' },
            { id: 'ui_group', name: 'UI Group' },
          ]}
        />
        <TextInput source='entity_id' required />
        <ReferenceInput source='language_id' reference='languages'>
          <SelectInput optionText='language_code' required />
        </ReferenceInput>
        <TextInput source='field_name' required />
        <TextInput source='localized_text' multiline required />
      </SimpleForm>
    </Create>
  );
};
