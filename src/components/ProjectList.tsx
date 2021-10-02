import React, { useEffect} from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  EditButton,
  DeleteButton,
  ListProps,
} from "react-admin";
import { useProjects } from "../providers/ProjectsContext";
import { useAuthState, useDataProvider } from "ra-core";
const ProjectList = (props: ListProps) => {

  const { setProjectsList, projectsList, selectedProject } = useProjects();
  const { authenticated } = useAuthState();
  const dataProvider = useDataProvider();
  useEffect(() => {
    if (!authenticated) return;
  // @ts-ignore
  dataProvider.getList<IProject>(`projects`).then((project) => {
      setProjectsList(project.data)
    })
  }, [authenticated]);


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
