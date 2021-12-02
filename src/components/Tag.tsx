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
  UpdateResult,
  CreateResult,
  useRefresh,
} from "react-admin";
import TranslatableField from "./common/TranslatableField";
import { ITag } from "types/tags";
import { Box } from "@material-ui/core";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
export const TagList = (props: ListProps): JSX.Element => {
  return (
    <Box pt={3}>
      <List
        {...props}
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
          <TextField source="filter" />
          <ReferenceField
            source="tag_category_id"
            reference="tagcategories"
            label="Tag Category"
          >
            <TextField source="name" />
          </ReferenceField>
        </Datagrid>
      </List>
    </Box>
  );
};

export const TagEdit = (props: EditProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Partial<ITag>;
    const promises: Promise<UpdateResult<Record>>[] = [];

    r.loc_msg_admin?.forEach((h) => {
      const patchLocalizedStringProm = dataProvider[h.id ? `update` : `create`](
        `localizedstrings`,
        {
          id: h.id,
          data: h,
          previousData: h,
        }
      );
      promises.push(patchLocalizedStringProm);
    });
    let responses = await Promise.all(promises);
    r.loc_msg = responses.map((h) => Number(h.data.id)) || [];

    r.loc_description_admin?.forEach((h) => {
      const patchLocalizedStringProm = dataProvider[h.id ? `update` : `create`](
        `localizedstrings`,
        {
          id: h.id,
          data: h,
          previousData: h,
        }
      );
      promises.push(patchLocalizedStringProm);
    });
    responses = await Promise.all(promises);
    r.loc_description = responses.map((h) => Number(h.data.id)) || [];

    delete r.loc_msg_admin;
    delete r.loc_description_admin;
    return r as Record;
  };

  const refresh = useRefresh();
  return (
    <Edit
      {...props}
      mutationMode="pessimistic"
      onSuccess={refresh}
      transform={transform}
    >
      <SimpleForm>
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
        <TextInput source="filter" />
        <TextInput source="data" />
      </SimpleForm>
    </Edit>
  );
};

export const TagCreate = (props: CreateProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const transform = async (record: Record): Promise<Record> => {
    const r = record as Partial<ITag>;

    /** create localized strings for msg */
    const msgPromises: Promise<CreateResult<Record>>[] = [];

    r.loc_msg_admin?.forEach((h) => {
      const createLocalizedStringProm = dataProvider.create(
        `localizedstrings`,
        {
          data: h,
        }
      );
      msgPromises.push(createLocalizedStringProm);
    });

    /** pass ids of created string */
    const msgResponses = await Promise.all(msgPromises);
    r.loc_msg = msgResponses.map((h) => Number(h.data.id)) || [];

    /** create localized string for description */
    const desPromises: Promise<CreateResult<Record>>[] = [];
    r.loc_description_admin?.forEach((h) => {
      const createLocalizedStringProm = dataProvider.create(
        `localizedstrings`,
        {
          data: h,
        }
      );
      desPromises.push(createLocalizedStringProm);
    });
    const desResponses = await Promise.all(desPromises);
    r.loc_description = desResponses.map((h) => Number(h.data.id)) || [];

    delete r.loc_msg_admin;
    delete r.loc_description_admin;
    return r as Record;
  };
  const refresh = useRefresh();
  return (
    <Create {...props} transform={transform} onSuccess={refresh}>
      <SimpleForm>
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
        <TextInput source="filter" />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
