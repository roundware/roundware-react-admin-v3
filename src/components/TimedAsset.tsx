import React from "react";
import RangeSlider from "components/common/RangeSlider";
import {
  Create,
  Datagrid,
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
import AudioPlayerField from "./common/AudioPlayerField";
import FormToolbar from "./common/FormToolbar";

export const TimedAssetList = (): JSX.Element => {
  return (
    <List
      filters={[
        <NumberInput
          source="start_sec__gte"
          key="start_sec__gte"
          label="Starts Greater Than"
        />,
        <NumberInput
          source="start_sec__lte"
          key="start_sec__lte"
          label="Starts Lesser Than"
        />,

        <NumberInput
          source="end_sec__gte"
          key="end_sec__gte"
          label="Ends Greater Than"
        />,

        <NumberInput
          source="end_sec__lte"
          key="end_sec__lte"
          label="Ends Lesser Than"
        />,
      ]}
      sort={{
        field: "start_sec",
        order: "ASC",
      }}
    >
      <Datagrid rowClick={""}>
        <TextField source="id" />
        <ReferenceField source="asset_id" reference="assets">
          <TextField source="file" />
        </ReferenceField>
        <ReferenceField source="asset_id" reference="assets" link={false}>
          <AudioPlayerField source="file" />
        </ReferenceField>

        <NumberField source="start_sec" sortable sortBy="ASC" />
        <NumberField source="end_sec" sortable />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const TimedAssetEdit = (): JSX.Element => {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText="id" />
        </ReferenceInput>

        <AudioPlayerField source="asset_id" inEditView label="Audio" />

        <RangeSlider minField="start_sec" maxField="end_sec" />
      </SimpleForm>
    </Edit>
  );
};

export const TimedAssetCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText={(record) => `${record?.id}`} />
        </ReferenceInput>
        <AudioPlayerField source="asset_id" inEditView label="Audio" />
        <RangeSlider minField="start_sec" maxField="end_sec" />
      </SimpleForm>
    </Create>
  );
};
