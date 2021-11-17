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
  ReferenceField,
  ArrayField,
  SingleFieldList,
  ChipField,
  EditButton,
  DeleteButton,
  RadioButtonGroupInput,
  BooleanField,
  BooleanInput,
  ReferenceInput,
  SelectInput,
  ArrayInput,
  SelectArrayInput,
  ReferenceArrayInput,
  SimpleFormIterator,
  AutocompleteArrayInput,
} from "react-admin";

export const UiGroupList = (props: ListProps): JSX.Element => {
  return (
    <List
      {...props}
      filters={[
        <RadioButtonGroupInput
          source="ui_mode"
          key="ui-mode-filter"
          alwaysOn
          style={{ marginTop: 35 }}
          choices={[
            { id: "listen", name: "Listen" },
            { id: "speak", name: "Speak" },
            { id: "browse", name: "Browse" },
          ]}
        />,
      ]}
      filterDefaultValues={{
        ui_mode: "speak",
      }}
    >
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
        <ReferenceField
          label="Tag Category"
          source="tag_category_id"
          reference="tagcategories"
        >
          <TextField source="name" />
        </ReferenceField>
        <ArrayField source="ui_items">
          <SingleFieldList>
            <ReferenceField source="tag_id" reference="tags">
              <ChipField source="value" />
            </ReferenceField>
          </SingleFieldList>
        </ArrayField>
        <BooleanField source="active" />
        <EditButton label="" />
        <DeleteButton label="" />
      </Datagrid>
    </List>
  );
};

export const UiGroupEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput disabled source="id" required />

        <TextInput source="name" fullWidth required />
        <TextInput source="header_text_loc" fullWidth />
        <RadioButtonGroupInput
          source="ui_mode"
          key="ui-mode-filter"
          alwaysOn
          choices={[
            { id: "listen", name: "Listen" },
            { id: "speak", name: "Speak" },
            { id: "browse", name: "Browse" },
          ]}
        />
        <RadioButtonGroupInput
          source="select"
          fullWidth
          defaultValue="single"
          choices={[
            { id: "single", name: "Single" },
            { id: "multi", name: "Multiple" },
            { id: "min_one", name: "Multiple Atleast One" },
          ]}
        />

        <ReferenceInput
          source="tag_category_id"
          reference="tagcategories"
          label="Select Tag Category"
        >
          <SelectInput optionText="name" />
        </ReferenceInput>

        <ArrayInput label="UI Items" source="ui_items">
          <SimpleFormIterator>
            <BooleanInput label="Active" source="active" />
            <BooleanInput label="Default" source="default" />
            <ReferenceInput label="Tag" source="tag_id" reference="tags">
              <SelectInput optionText="value" />
            </ReferenceInput>
          </SimpleFormIterator>
        </ArrayInput>

        <BooleanInput source="active" />
      </SimpleForm>
    </Edit>
  );
};

export const UiGroupCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput source="id" required />
      </SimpleForm>
    </Create>
  );
};
