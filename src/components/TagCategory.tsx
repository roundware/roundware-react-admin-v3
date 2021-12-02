import useFieldValue from "hooks/useFieldValue";
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
  useRedirect,
  DatagridCellProps,
} from "react-admin";
import { Button } from "@material-ui/core";
export const TagCategoryList = (props: ListProps): JSX.Element => {
  return (
    <List {...props}>
      <Datagrid optimized>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="data" />
        <RedirectButton />
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
      <SimpleForm>
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
      <SimpleForm>
        <TextInput source="name" required />
        <TextInput source="data" />
      </SimpleForm>
    </Create>
  );
};
