import { Button } from "@mui/material";
import React from "react";
import {
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  SimpleForm,
  TextField,
  TextInput,
  useRecordContext,
  useRedirect,
} from "react-admin";
import CopyResourceButton from "./common/CopyResource";
import FormToolbar from "./common/FormToolbar";
export const TagCategoryList = (): JSX.Element => {
  return (
    <List>
      <Datagrid optimized>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="data" />
        <RedirectButton />
        <EditButton />
        <CopyResourceButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

const RedirectButton = () => {
  const redirect = useRedirect();
  const record = useRecordContext();
  const handleOnViewTags = () => {
    redirect(
      `list`,
      `/tags?filter=${JSON.stringify({ tag_category_id: record?.id })}`,
      undefined,
      {}
    );
  };
  return (
    <Button color="primary" onClick={handleOnViewTags}>
      View Tags{" "}
    </Button>
  );
};

export const TagCategoryEdit = (): JSX.Element => {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" required disabled />
        <TextInput source="name" required />
        <TextInput source="data" />
      </SimpleForm>
    </Edit>
  );
};

export const TagCategoryCreate = (): JSX.Element => {
  return (
    <Create redirect="list">
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <TextInput source="name" required />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
