import * as React from "react";
import { createElement } from "react";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core";
import {
  DashboardMenuItem,
  Menu as RAMenu,
  MenuItemLink,
  getResources,
  MenuProps,
} from "react-admin";
import DefaultIcon from "@material-ui/icons/ViewList";
import LabelIcon from "@material-ui/icons/Label";
import { useProjects } from "../../providers/ProjectsContext";

const useStyles = makeStyles((theme) => ({
  raMenu: {
    paddingTop: "30px",
  },
}));

export const Menu = (props: MenuProps) => {
  const resources = useSelector(getResources);
  const classes = useStyles();
  const { selectedProject } = useProjects();
  return (
    <RAMenu {...props} className={classes.raMenu}>
      {/* @ts-ignore */}
      <MenuItemLink
        key={"projects"}
        to={{
          pathname: `/${
            selectedProject ? `projects/${selectedProject.id}/show` : `projects`
          }`,
        }}
        primaryText={selectedProject ? `Project Overview` : `All Projects`}
      />
      {selectedProject &&
        resources
          .filter((resource) => resource.name !== "projects")
          .sort((a, b) => (a.name > b.name ? 1 : -1))
          .map((resource) => (
            //   @ts-ignore
            <MenuItemLink
              key={resource.name}
              to={{
                pathname: `/${resource.name}`,
                search: `filter=project_id=${selectedProject.id}`,
              }}
              primaryText={
                (resource.options && resource.options.label) ||
                resource.name.toString().charAt(0).toUpperCase() +
                  resource.name.substr(1)
              }
              leftIcon={resource.icon ? <resource.icon /> : <DefaultIcon />}
            />
          ))}
      {/* add your custom menus here */}
    </RAMenu>
  );
};
