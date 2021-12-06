import { Button } from "@material-ui/core";
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
  useRedirect,
} from "react-admin";
export const TagCategoryList = (props: ListProps): JSX.Element => {
  return (
    <List {...props}>
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
  const handleOnViewTags = () => {
    redirect(
      `list`,
      `/tags?filter=${JSON.stringify({ tag_category_id: props?.record?.id })}`,
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

export const TagCategoryEdit = (props: EditProps): JSX.Element => {
  return (
    <Edit {...props}>
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
    <Create {...props}>
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="name" required />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
