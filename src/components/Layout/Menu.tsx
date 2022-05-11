import { useMediaQuery } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { AccountTree } from "@mui/icons-material";
import DefaultIcon from "@mui/icons-material/ViewList";
import * as React from "react";
import {
  DashboardMenuItem,
  Menu as RAMenu,
  MenuItemLink,
  MenuProps,
  useResourceDefinitions,
  useSidebarState,
} from "react-admin";

import { useProjects } from "../../providers/ProjectsContext";

const useStyles = makeStyles(() => ({
  raMenu: {
    paddingTop: "30px",
  },
}));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const Menu = (props: MenuProps) => {
  const resourcesDefinitions = useResourceDefinitions();
  const resources = Object.keys(resourcesDefinitions).map(
    (name) => resourcesDefinitions[name]
  );
  const classes = useStyles();
  const { selectedProject } = useProjects();
  const [, setOpen] = useSidebarState();
  const openMenu = () => setOpen(true);

  const isBigScreen = useMediaQuery(`(min-width:1024px)`);
  const closeMenu = () => {
    if (isBigScreen) return;
    setOpen(false);
  };

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
        {/* {selectedProject && (
          <MenuItemLink
            key={"build-iui"}
            to={{
              pathname: `/buildui`,
            }}
            primaryText={"Build UI"}
            leftIcon={<BuildIcon />}
          />
        )} */}
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
