import React from "react";
import {
  ListProps,
  EditProps,
  CreateProps,
  List,
  Datagrid,
  Edit,
  SimpleForm,
  Create,
  TextField,
  TextInput,
  ReferenceField,
  NumberField,
  NumberInput,
  ReferenceInput,
  SelectInput,
} from "react-admin";

export const TimedAssetList = (props: ListProps): JSX.Element => {
  return (
    <List
      {...props}
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
      <Datagrid rowClick={"edit"}>
        <TextField source="id" />
        <ReferenceField source="asset_id" reference="assets">
          <TextField source="file" />
        </ReferenceField>

        <NumberField source="start" sortable sortBy="ASC" />
        <NumberField source="end" sortable />
      </Datagrid>
    </List>
  );
};

export const TimedAssetEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText="id" />
        </ReferenceInput>
        <NumberInput source="start" />
        <NumberInput source="end" />
      </SimpleForm>
    </Edit>
  );
};

export const TimedAssetCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm>
        <ReferenceInput source="asset_id" reference="assets">
          <SelectInput optionText={(record) => `${record?.id}`} />
        </ReferenceInput>
        <NumberInput source="start" />
        <NumberInput source="end" />
      </SimpleForm>
    </Create>
  );
};
