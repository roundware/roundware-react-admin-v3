import { makeStyles } from "@material-ui/core";
import { AccountTree } from "@material-ui/icons";
import DefaultIcon from "@material-ui/icons/ViewList";
import * as React from "react";
import {
  DashboardMenuItem,
  getResources,
  Menu as RAMenu,
  MenuItemLink,
  MenuProps,
  setSidebarVisibility,
} from "react-admin";
import { useDispatch, useSelector } from "react-redux";
import { useProjects } from "../../providers/ProjectsContext";
const useStyles = makeStyles((theme) => ({
  raMenu: {
    paddingTop: "30px",
  },
}));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const Menu = (props: MenuProps) => {
  const resources = useSelector(getResources);
  const classes = useStyles();
  const { selectedProject } = useProjects();
  const dispatch = useDispatch();
  const openMenu = () => dispatch(setSidebarVisibility(true));
  const closeMenu = () => dispatch(setSidebarVisibility(false));

  return (
    <RAMenu {...props} className={classes.raMenu}>
      <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
        {selectedProject && <DashboardMenuItem />}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <MenuItemLink
          key={"projects"}
          to={{
            pathname: `/${
              selectedProject
                ? `projects/${selectedProject.id}/show`
                : `projects`
            }`,
          }}
          primaryText={selectedProject ? `Project` : `All Projects`}
          leftIcon={<AccountTree />}
        />
        {selectedProject &&
          resources
            .filter((resource) => resource.name !== "projects")
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map((resource) => (
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //   @ts-ignore
              <MenuItemLink
                key={resource.name}
                to={{
                  pathname: `/${resource.name}`,
                }}
                primaryText={
                  (resource.options && resource.options.label) ||
                  resource.name.toString().charAt(0).toUpperCase() +
                    resource.name.substr(1)
                }
                leftIcon={resource.icon ? <resource.icon /> : <DefaultIcon />}
              />
            ))}
      </div>
    </RAMenu>
  );
};
