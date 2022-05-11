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
  ReferenceInput,
  SelectInput,
  TextField,
  ReferenceField,
  Record,
  useRefresh,
  EditButton,
  DeleteButton,
} from "react-admin";
import TranslatableField from "./common/TranslatableField";
import { ITag } from "types/tags";
import { Box } from "@mui/material";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { handleLocalizedStrings } from "utils";
import { useBuildUI } from "providers/BuildUIContext";

export const TagList = (props: ListProps): JSX.Element => {
  return (
    <Box pt={3}>
      <List
        filters={[
          <ReferenceInput
            source="tag_category_id"
            reference="tagcategories"
            label="Tag Category "
            key="tagcategories"
            alwaysOn
          >
            <SelectInput optionText="name" fullWidth />
          </ReferenceInput>,
        ]}
      >
        <Datagrid rowClick="edit" optimized>
          <TextField source="id" />
          <TextField source="value" />
          <TextField source="description" />
          <TextField source="msg_loc" label="Message" />
          <ReferenceField
            source="tag_category_id"
            reference="tagcategories"
            label="Tag Category"
          >
            <TextField source="name" />
          </ReferenceField>
          <EditButton />
          <DeleteButton />
        </Datagrid>
      </List>
    </Box>
  );
};

export const TagEdit = (props: EditProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Partial<ITag>;

    if (r.loc_msg_admin) {
      r.loc_msg = await handleLocalizedStrings(r.loc_msg_admin, dataProvider);
    }
    if (r.loc_description_admin) {
      r.loc_description = await handleLocalizedStrings(
        r.loc_description_admin,
        dataProvider
      );
    }

    delete r.loc_msg_admin;
    delete r.loc_description_admin;
    return r as Record;
  };

  const { refetchData } = useBuildUI();

  const refresh = useRefresh();
  return (
    <Edit
      mutationMode="pessimistic"
      queryOptions={{
        onSuccess: () => {
          refresh();
          refetchData();
        },
      }}
      transform={transform}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
        <ReferenceInput
          source="tag_category_id"
          reference="tagcategories"
          label="Tag Category"
          required
          key="tagcategories"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
        <TextInput source="value" />
        <TextInput source="description" />
        <TranslatableField source="loc_msg_admin" label={`Localized Message`} />
        <TranslatableField
          source="loc_description_admin"
          label={`Localized Description`}
        />
        <SelectInput
          source="filter"
          choices={[
            { id: "", name: "No Filter" },
            { id: "_within_10km", name: "Assets Within 10KM" },
            {
              id: "_ten_most_recent_days",
              name: "Assets created within 10 days.",
            },
          ]}
        />
        <TextInput source="data" />
      </SimpleForm>
    </Edit>
  );
};

export const TagCreate = (props: CreateProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Partial<ITag>;

    if (r.loc_msg_admin)
      r.loc_msg = await handleLocalizedStrings(r.loc_msg_admin, dataProvider);

    if (r.loc_description_admin)
      r.loc_description = await handleLocalizedStrings(
        r.loc_description_admin,
        dataProvider
      );

    delete r.loc_msg_admin;
    delete r.loc_description_admin;
    return r as Record;
  };
  const refresh = useRefresh();
  const { refetchData } = useBuildUI();
  return (
    <Create
      transform={transform}
      queryOptions={{
        onSuccess: () => {
          refresh();
          refetchData();
        },
      }}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <ReferenceInput
          source="tag_category_id"
          reference="tagcategories"
          label="Tag Category"
          required
          key="tagcategories"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>
        <TextInput source="value" />
        <TextInput source="description" />
        <TranslatableField source="loc_msg_admin" label={`Localized Message`} />
        <TranslatableField
          source="loc_description_admin"
          label={`Localized Description`}
        />
        <SelectInput
          source="filter"
          choices={[
            { id: "", name: "No Filter" },
            { id: "_within_10km", name: "Assets Within 10KM" },
            {
              id: "_ten_most_recent_days",
              name: "Assets created within 10 days.",
            },
          ]}
        />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
