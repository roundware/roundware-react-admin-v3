import { Box } from "@mui/material";
import { useBuildUI } from "providers/BuildUIContext";

import React from "react";
import {
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  RaRecord,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useDataProvider,
  useRefresh,
} from "react-admin";
import { ITag } from "types/tags";
import { handleLocalizedStrings } from "utils";
import CopyResourceButton from "./common/CopyResource";
import FormToolbar from "./common/FormToolbar";
import TranslatableField from "./common/TranslatableField";

export const TagList = (): JSX.Element => {
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
          <CopyResourceButton />
        </Datagrid>
      </List>
    </Box>
  );
};

export const TagEdit = (): JSX.Element => {
  const dataProvider = useDataProvider();
  const transform = async (record: RaRecord): Promise<RaRecord> => {
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
    return r as RaRecord;
  };

  const { refetchData } = useBuildUI();

  const refresh = useRefresh();
  return (
    <Edit
      mutationMode="pessimistic"
      mutationOptions={{
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

export const TagCreate = (): JSX.Element => {
  const dataProvider = useDataProvider();
  const transform = async (record: RaRecord): Promise<RaRecord> => {
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
    return r as RaRecord;
  };
  const refresh = useRefresh();
  const { refetchData } = useBuildUI();
  return (
    <Create
      transform={transform}
      mutationOptions={{
        onSuccess: () => {
          refresh();
          refetchData();
        },
      }}
    >
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
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
