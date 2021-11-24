import React from "react";
import { Grid } from "@material-ui/core";
import {
  ArrayInput,
  BooleanInput,
  Create,
  CreateProps,
  Edit,
  EditProps,
  RadioButtonGroupInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
  TranslatableInputs,
  useEditController,
  NumberInput,
} from "react-admin";

export const UiGroupEdit = (props: EditProps): JSX.Element => {
  const { record } = useEditController(props);
  return (
    <Edit
      {...props}
      transform={(r) => {
        delete r.header_text_loc;
        return r;
      }}
    >
      <SimpleForm>
        <Grid container style={{ width: "100%" }} spacing={2}>
          <Grid item xs={12} md={6}>
            {/* <ArrayInput label="UI Items" source="ui_items">
              <SimpleFormIterator>
                <BooleanInput label="Active" source="active" />
                <BooleanInput label="Default" source="default" />

                <ReferenceInput
                  label="Tag"
                  source="tag_id"
                  reference="tags"
                  filter={{
                    tag_category_id: record?.tag_category_id,
                  }}
                >
                  <SelectInput optionText="value" />
                </ReferenceInput>
              </SimpleFormIterator>
            </ArrayInput> */}
          </Grid>
          <Grid item xs={12} md={6}>
            <TextInput disabled fullWidth source="id" required />
            <NumberInput source="index" fullWidth required />

            <ReferenceInput
              source="tag_category_id"
              reference="tagcategories"
              label="Select Tag Category"
            >
              <SelectInput optionText="name" fullWidth />
            </ReferenceInput>
            <TextInput source="name" fullWidth required />
            <TranslatableInputs locales={["en"]}>
              <TextInput source="header_text_loc" fullWidth />
            </TranslatableInputs>
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

            <BooleanInput source="active" />
          </Grid>
        </Grid>
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
