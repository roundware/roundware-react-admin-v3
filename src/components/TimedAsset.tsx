import RangeSlider from "components/common/RangeSlider";
import React from "react";
import {
  Create,
  CreateProps,
  Datagrid,
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
import AudioPlayerField from "./common/AudioPlayerField";

export const TimedAssetList = (): JSX.Element => {
  return (
    <List
      filters={[
        <NumberInput
          source="start__gte"
          key="start__gte"
          label="Starts Greater Than"
        />,
        <NumberInput
          source="start__lte"
          key="start__lte"
          label="Starts Lesser Than"
        />,

        <NumberInput
          source="end__gte"
          key="end__gte"
          label="Ends Greater Than"
        />,

        <NumberInput
          source="end__lte"
          key="end__gte"
          label="Ends Greater Than"
        />,
      ]}
      sort={{
        field: "start",
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

        <NumberField source="start" sortable sortBy="ASC" />
        <NumberField source="end" sortable />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const TimedAssetEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" disabled />
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText="id" />
        </ReferenceInput>

        <AudioPlayerField source="asset_id" inEditView label="Audio" />

        <RangeSlider minField="start" maxField="end" />
      </SimpleForm>
    </Edit>
  );
};

export const TimedAssetCreate = (): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText={(record) => `${record?.id}`} />
        </ReferenceInput>
        <AudioPlayerField source="asset_id" inEditView label="Audio" />
        <RangeSlider minField="start" maxField="end" />
      </SimpleForm>
    </Create>
  );
};
