import { AccountTree, Business, Groups, Settings } from "@mui/icons-material";
import DefaultIcon from "@mui/icons-material/ViewList";
import { useMediaQuery } from "@mui/material";
import * as React from "react";
import {
  Menu as RAMenu,
  MenuItemLink,
  MenuProps,
  usePermissions,
  useResourceDefinitions,
  useSidebarState,
} from "react-admin";

import AdjustIcon from "@mui/icons-material/Adjust";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PublicIcon from "@mui/icons-material/Public";
import { capitalize } from "lodash";
import { useProjects } from "../../context/ProjectsContext";
import SubMenu from "./SubMenu";

const uiOrder: { [key: string]: string[] } = {
  primary: ["assets", "audiotracks", "speakers", "tags", "uigroups", "timedassets"],
  secondary: ["envelopes", "listenevents", "sessions", "tagcategories"],
  global: ["languages", "localizedstrings", "users", "notifications"],
};

const icons: { [index: string]: JSX.Element } = {
  primary: <CategoryIcon />,
  secondary: <AdjustIcon />,
  global: <PublicIcon />,
};

 
export const Menu = (props: MenuProps) => {
  const resourcesDefinitions = useResourceDefinitions();
  const resources = Object.keys(resourcesDefinitions).map(
    (name) => resourcesDefinitions[name]
  );
  const { selectedProject } = useProjects();
  const [, setOpen] = useSidebarState();
  const { permissions } = usePermissions();
  const isSuperuser = permissions?.isSuperuser === true;
  const openMenu = () => setOpen(true);

  const isBigScreen = useMediaQuery(`(min-width:1024px)`);
  const closeMenu = () => {
    if (isBigScreen) return;
    setOpen(false);
  };

  const [state, setState] = React.useState<{ [index: string]: boolean }>({
    primary: true,
    secondary: true,
    global: true,
    tenant: true,
    platform: true,
  });

  const handleToggle = (menu: string) => {
    setState((state) => ({ ...state, [menu]: !state[menu] }));
  };

  return (
    <RAMenu {...props} sx={{ pt: "30px" }}>
      <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
        {selectedProject && (
          <MenuItemLink
            key="dashboard"
            primaryText="Dashboard"
            leftIcon={<DashboardIcon />}
            to={{ pathname: `/project/${selectedProject.id}` }}
          />
        )}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <MenuItemLink
          key="projects"
          to={{
            pathname: `/${
              selectedProject
                ? `project/${selectedProject.id}/projects/${selectedProject.id}/show`
                : `projects`
            }`,
          }}
          primaryText={selectedProject ? "Project" : "All Projects"}
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
                .map((i) => resources.find((r) => r.name === i))
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
                      leftIcon={resource.icon ? <resource.icon /> : <DefaultIcon />}
                    />
                  ) : null
                )}
            </SubMenu>
          ))}

        {/* Tenant section — visible to all authenticated users */}
        <SubMenu
          key="tenant"
          isOpen={state.tenant}
          name="Tenant"
          dense={false}
          handleToggle={() => handleToggle("tenant")}
          icon={<Groups />}
        >
          <MenuItemLink
            key="team"
            to={{ pathname: "/team" }}
            primaryText="Team"
            leftIcon={<Groups />}
          />
          <MenuItemLink
            key="settings"
            to={{ pathname: "/settings" }}
            primaryText="Settings"
            leftIcon={<Settings />}
          />
        </SubMenu>

        {/* Platform section — superusers only */}
        {isSuperuser && (
          <SubMenu
            key="platform"
            isOpen={state.platform}
            name="Platform"
            dense={false}
            handleToggle={() => handleToggle("platform")}
            icon={<Business />}
          >
            <MenuItemLink
              key="tenants"
              to={{ pathname: "/tenants" }}
              primaryText="Tenants"
              leftIcon={<Business />}
            />
          </SubMenu>
        )}
      </div>
    </RAMenu>
  );
};
