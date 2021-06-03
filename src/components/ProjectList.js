import React from 'react';
import { List, Datagrid, TextField, DateField, EditButton, DeletButton } from 'react-admin';

const ProjectList = (props) => {
  return <List {...props}>
    <Datagrid>
      <TextField source='id' />
    </Datagrid>
  </List>
}

export default ProjectList;
