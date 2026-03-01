import { Box } from "@mui/material";
import { useBuildUI } from "../context/BuildUIContext";

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
    useRedirect,
    useRefresh,
} from "react-admin";
import { ITag } from "../types/tags";
import { buildLocalizationsPayload } from "../utils.tsx";
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
  const transform = (record: RaRecord): RaRecord => {
    const data = { ...record };
    data.localizations = buildLocalizationsPayload(data, {
      loc_msg_admin: "value",
      loc_description_admin: "description",
    });
    delete data.loc_msg_admin;
    delete data.loc_description_admin;
    delete data.loc_msg;
    delete data.loc_description;
    return data;
  };

  const { refetchData } = useBuildUI();

  const refresh = useRefresh();
  const redirect = useRedirect();
  return (
    <Edit
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          refresh();
          refetchData();
          redirect(`list`, `/tags`);
        },
      }}
      redirect="list"
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
  const transform = (record: RaRecord): RaRecord => {
    const data = { ...record };
    data.localizations = buildLocalizationsPayload(data, {
      loc_msg_admin: "value",
      loc_description_admin: "description",
    });
    delete data.loc_msg_admin;
    delete data.loc_description_admin;
    delete data.loc_msg;
    delete data.loc_description;
    return data;
  };
  const refresh = useRefresh();
  const { refetchData } = useBuildUI();
  const redirect = useRedirect();
  return (
    <Create
      transform={transform}
      mutationOptions={{
        onSuccess: async () => {
          refresh();
          refetchData();
          redirect(`list`, `/tags`);
        },
      }}
      redirect="list"
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
