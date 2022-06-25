import { AccountTree } from "@mui/icons-material";
import DefaultIcon from "@mui/icons-material/ViewList";
import { MenuItem, useMediaQuery } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import * as React from "react";
import {
  DashboardMenuItem,
  Menu as RAMenu,
  MenuItemLink,
  MenuProps,
  useResourceDefinitions,
  useSidebarState,
} from "react-admin";

import AdjustIcon from "@mui/icons-material/Adjust";
import CategoryIcon from "@mui/icons-material/Category";
import PublicIcon from "@mui/icons-material/Public";
import { capitalize } from "lodash";
import { useProjects } from "../../providers/ProjectsContext";
import SubMenu from "./SubMenu";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
const useStyles = makeStyles(() => ({
  raMenu: {
    paddingTop: "30px",
  },
}));

const uiOrder: {
  [key: string]: string[];
} = {
  primary: [
    "assets",
    "audiotracks",
    `speakers`,
    `tags`,
    `uigroups`,
    `timedassets`,
  ],
  secondary: [`envelopes`, `listenevents`, `sessions`, `tagcategories`],
  global: [`languages`, `localizedstrings`, `users`],
};

const icons: {
  [index: string]: JSX.Element;
} = {
  primary: <CategoryIcon />,
  secondary: <AdjustIcon />,
  global: <PublicIcon />,
};
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

  const [state, setState] = React.useState<{
    [index: string]: boolean;
  }>({
    primary: true,
    secondary: true,
    global: true,
  });

  const [open] = useSidebarState();

  const handleToggle = (menu: string) => {
    setState((state) => ({ ...state, [menu]: !state[menu] }));
  };

  const navigate = useNavigate();

  return (
    <RAMenu {...props} className={classes.raMenu}>
      <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
        {selectedProject && (
          <MenuItemLink
            key={`dashboard`}
            primaryText={`Dashboard`}
            leftIcon={<DashboardIcon />}
            to={{
              pathname: `/project/${selectedProject.id}`,
            }}
          />
        )}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <MenuItemLink
          key={"projects"}
          to={{
            pathname: `/${
              selectedProject
                ? `project/${selectedProject.id}/projects/${selectedProject.id}/show`
                : `projects`
            }`,
          }}
          primaryText={selectedProject ? `Project` : `All Projects`}
          leftIcon={<AccountTree />}
        />

        {selectedProject &&
          Object.keys(uiOrder).map((g) => (
            <SubMenu
              key={g}
              isOpen={state[g]}
              name={capitalize(g)}
              dense={false}
              handleToggle={() => handleToggle(g)}
              icon={icons[g]}
            >
              {uiOrder[g]
                .map((i) => resources.find((r) => r.name == i))
                .map((resource) =>
                  resource ? (
                    <MenuItemLink
                      key={resource.name}
                      to={{
                        pathname: `/project/${selectedProject.id}/${resource.name}`,
                      }}
                      primaryText={
                        (resource.options && resource.options.label) ||
                        resource.name.toString().charAt(0).toUpperCase() +
                          resource.name.substr(1)
                      }
                      leftIcon={
                        resource.icon ? <resource.icon /> : <DefaultIcon />
                      }
                    />
                  ) : null
                )}
            </SubMenu>
          ))}
      </div>
    </RAMenu>
  );
};
