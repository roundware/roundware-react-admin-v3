import React from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  EditButton,
  DeleteButton
} from "react-admin";

const ProjectList = (props) => {
  return <List {...props}>
    <Datagrid>
      <TextField source='id' />
      <TextField source='name' />
      <NumberField source='latitude' options={{ maximumFractionDigits: 8 }} />
      <NumberField source='longitude' options={{ maximumFractionDigits: 8 }} />
      <EditButton basePath="/projects" />
      <DeleteButton basePath="/projects" />
    </Datagrid>
  </List>
}

export default ProjectList;
