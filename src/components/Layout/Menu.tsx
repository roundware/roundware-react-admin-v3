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
  ResourceDefinition,
  useResourceDefinitions,
  useSidebarState,
} from "react-admin";

import { useProjects } from "../../providers/ProjectsContext";
import SubMenu from "./SubMenu";
import { capitalize } from "lodash";
import PublicIcon from "@mui/icons-material/Public";
import CategoryIcon from "@mui/icons-material/Category";
import AdjustIcon from "@mui/icons-material/Adjust";
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

        {Object.keys(uiOrder).map((g) => (
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
                      pathname: `/${resource.name}`,
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
