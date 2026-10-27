import { Box, Typography } from "@mui/material";

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
    SimpleForm,
    TextField,
    TextInput,
    useRedirect,
    useRefresh,
} from "react-admin";
import { ITag } from "../types/tags";
import { buildLocalizationsPayload } from "../utils";
import CopyResourceButton from "./common/CopyResource";
import FormToolbar from "./common/FormToolbar";
import TranslatableField from "./common/TranslatableField";
import ProjectTagCategoryInput from "./common/ProjectTagCategoryInput";

/**
 * A tag's two texts (2026-10-27). Participants see the participant text (the
 * description), translated, a tab per language — the default language's tab
 * is the tag itself (server docs/017). The short name (the value) is the
 * admin's: in its lists, Filters & Menus, exports and the contributions
 * table; one language. data and filter did nothing in v3 and left the form
 * (still stored, for imported v2 projects); v2's "message" became the value.
 */
const TagTextFields = (): JSX.Element => (
  <>
    <TranslatableField source="loc_description_admin" label="Participant text" multiline />
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -1, mb: 2 }}>
      What participants see: the response on a recording question, a listening filter, the tags
      on a contribution. It shows wherever the tag does, so keep it as short as reads well.
    </Typography>
    <TextInput
      source="value"
      label="Short name"
      required
      fullWidth
      helperText="For you, not participants: how the tag is listed here, in Filters & Menus and in exports."
    />
  </>
);

export const TagList = (): JSX.Element => {
  return (
    <Box pt={3}>
      <List
        filters={[
          <ProjectTagCategoryInput source="tag_category_id" key="tagcategories" filter alwaysOn />,
        ]}
      >
        <Datagrid rowClick="edit" optimized>
          <TextField source="id" />
          <TextField source="value" label="Short name" />
          <TextField source="description" label="Participant text" />
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
    // Only the participant text is translated. The value's old translations
    // (still on the record) aren't sent: in the default language they'd
    // overwrite an edited short name with the old text.
    data.localizations = buildLocalizationsPayload(data, {
      loc_description_admin: "description",
    });
    delete data.loc_msg_admin;
    delete data.loc_description_admin;
    delete data.loc_msg;
    delete data.loc_description;
    return data;
  };


  const refresh = useRefresh();
  const redirect = useRedirect();
  return (
    <Edit
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          refresh();
          redirect(`list`, `/tags`);
        },
      }}
      redirect="list"
      transform={transform}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required />
        <ProjectTagCategoryInput source="tag_category_id" required />
        <TagTextFields />
      </SimpleForm>
    </Edit>
  );
};

export const TagCreate = (): JSX.Element => {
  const transform = (record: RaRecord): RaRecord => {
    const data = { ...record };
    // Only the participant text is translated. The value's old translations
    // (still on the record) aren't sent: in the default language they'd
    // overwrite an edited short name with the old text.
    data.localizations = buildLocalizationsPayload(data, {
      loc_description_admin: "description",
    });
    delete data.loc_msg_admin;
    delete data.loc_description_admin;
    delete data.loc_msg;
    delete data.loc_description;
    return data;
  };
  const refresh = useRefresh();
  const redirect = useRedirect();
  return (
    <Create
      transform={transform}
      mutationOptions={{
        onSuccess: async () => {
          refresh();
          redirect(`list`, `/tags`);
        },
      }}
      redirect="list"
    >
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <ProjectTagCategoryInput source="tag_category_id" required />
        <TagTextFields />
      </SimpleForm>
    </Create>
  );
};
