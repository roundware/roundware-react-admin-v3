import { Button } from "@mui/material";
import React from "react";
import {
  Create,
  CreateProps,
  Datagrid,
  DatagridCellProps,
  DeleteButton,
  Edit,
  EditButton,
  EditProps,
  List,
  ListProps,
  SimpleForm,
  TextField,
  TextInput,
  useRecordContext,
  useRedirect,
} from "react-admin";
export const TagCategoryList = (): JSX.Element => {
  return (
    <List>
      <Datagrid optimized>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="data" />
        <RedirectButton />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

const RedirectButton = (props: DatagridCellProps) => {
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

export const TagCategoryCreate = (props: CreateProps): JSX.Element => {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="name" required />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
