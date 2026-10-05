import {
  AccountTree,
  Business,
  Campaign,
  CategoryOutlined,
  DesignServices,
  Groups,
  Insights,
  Inventory2Outlined,
  Palette,
  PlayCircleOutline,
  Settings,
  Speed,
  Translate,
  Tune,
} from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GraphicEq from "@mui/icons-material/GraphicEq";
import DefaultIcon from "@mui/icons-material/ViewList";
import PublicIcon from "@mui/icons-material/Public";
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
import { useProjects } from "../../context/ProjectsContext";
import SubMenu from "./SubMenu";

// ---------------------------------------------------------------------------
// The sidebar, grouped by what people come to do rather than by how the data
// is stored, and trimmed to the person's role.
//
// Hiding is for clarity only: the server refuses what a role can't do. Each
// item names the lowest role that can use it — for anything that saves, the
// lowest role the server lets save it (content: editor; project settings,
// look, sound, publishing, invitations: admin; plan and organization: owner).
// A group with nothing left to show disappears.
// ---------------------------------------------------------------------------

type Role = "viewer" | "editor" | "admin" | "owner" | "superuser";
const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2, owner: 3, superuser: 4 };

interface Item {
  key: string;
  label: string;
  /** Path within the project (`/project/:id/<path>`), or an absolute path. */
  path: string;
  /** Needs a selected project; tenant-wide pages don't. */
  inProject: boolean;
  min: Role;
  icon?: JSX.Element;
}

interface Group {
  key: string;
  label: string;
  icon: JSX.Element;
  items: Item[];
  /** Open the first time someone sees it; after that their choice is kept. */
  openByDefault: (role: Role) => boolean;
}

/** A project page backed by a react-admin resource (its icon comes from App.tsx). */
const resource = (name: string, label: string, min: Role): Item => ({
  key: name,
  label,
  path: name,
  inProject: true,
  min,
});

const page = (key: string, label: string, path: string, min: Role, icon: JSX.Element): Item => ({
  key,
  label,
  path,
  inProject: true,
  min,
  icon,
});

const GROUPS: Group[] = [
  {
    key: "content",
    label: "Content",
    icon: <Inventory2Outlined />,
    openByDefault: () => true,
    items: [resource("assets", "Contributions", "viewer"), resource("speakers", "Speakers", "viewer")],
  },
  {
    key: "design",
    label: "Design",
    icon: <DesignServices />,
    openByDefault: () => true,
    items: [
      page("customize", "Customize", "customize", "admin", <Palette />),
      page("audio-lab", "Audio lab", "audio-lab", "admin", <GraphicEq />),
      resource("tags", "Tags", "editor"),
      resource("uigroups", "Filters & menus", "editor"),
      // The selected project's own settings (projects/:id is its edit page).
      page("project", "Project settings", "projects/:id", "admin", <AccountTree />),
    ],
  },
  {
    key: "launch",
    label: "Launch",
    icon: <Campaign />,
    openByDefault: () => true,
    items: [
      page("test-app", "Test app", "test-app", "viewer", <PlayCircleOutline />),
      page("publish", "Publish", "publish", "admin", <PublicIcon />),
    ],
  },
  {
    key: "activity",
    label: "Activity",
    icon: <Insights />,
    openByDefault: () => false,
    items: [resource("sessions", "Sessions", "admin"), resource("listenevents", "Listen events", "admin")],
  },
  {
    key: "advanced",
    label: "Advanced",
    icon: <Tune />,
    // Superusers work in here; for everyone else it stays out of the way.
    openByDefault: (role) => role === "superuser",
    items: [
      resource("audiotracks", "Audio tracks", "editor"),
      resource("timedassets", "Timed assets", "editor"),
      resource("tagcategories", "Tag categories", "editor"),
      { ...resource("languages", "Languages", "admin"), icon: <Translate /> },
      resource("localizedstrings", "Translations", "editor"),
      resource("notifications", "Notifications", "editor"),
    ],
  },
  {
    key: "organization",
    label: "Organization",
    icon: <Groups />,
    openByDefault: () => true,
    items: [
      { key: "team", label: "Team", path: "/team", inProject: false, min: "viewer", icon: <Groups /> },
      { key: "settings", label: "Settings", path: "/settings", inProject: false, min: "owner", icon: <Settings /> },
      { key: "plan", label: "Plan", path: "/plan", inProject: false, min: "admin", icon: <Speed /> },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    icon: <Business />,
    openByDefault: () => true,
    items: [
      { key: "tenants", label: "Tenants", path: "/tenants", inProject: false, min: "superuser", icon: <Business /> },
      // Every project in the current tenant, as tiles. Across all tenants is
      // backlogged (010).
      { key: "all-projects", label: "All projects", path: "/projects", inProject: false, min: "superuser", icon: <CategoryOutlined /> },
    ],
  },
];

// Which groups are open, per person, in this browser. A convenience only:
// without storage the defaults apply.
const OPEN_KEY = "rw-admin-menu-open";
const readOpen = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || "{}") ?? {};
  } catch {
    return {};
  }
};
const writeOpen = (open: Record<string, boolean>) => {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  } catch {
    /* not kept; the menu still works */
  }
};

export const Menu = (props: MenuProps) => {
  const resources = useResourceDefinitions();
  const { selectedProject } = useProjects();
  const [, setSidebarOpen] = useSidebarState();
  const { permissions } = usePermissions();
  const role: Role = permissions?.isSuperuser
    ? "superuser"
    : permissions?.role in RANK
      ? (permissions.role as Role)
      : "viewer";
  const allowed = (item: Item) => RANK[role] >= RANK[item.min];

  const isBigScreen = useMediaQuery(`(min-width:1024px)`);
  const openMenu = () => setSidebarOpen(true);
  const closeMenu = () => {
    if (!isBigScreen) setSidebarOpen(false);
  };

  const [open, setOpen] = React.useState<Record<string, boolean>>(readOpen);
  const isOpen = (g: Group) => open[g.key] ?? g.openByDefault(role);
  const toggle = (g: Group) =>
    setOpen((prev) => {
      const next = { ...prev, [g.key]: !(prev[g.key] ?? g.openByDefault(role)) };
      writeOpen(next);
      return next;
    });

  const href = (item: Item): string => {
    const pid = selectedProject?.id;
    // All projects is tenant-wide, but reached from inside a project too.
    if (item.key === "all-projects" && pid) return `/project/${pid}/projects`;
    if (!item.inProject) return item.path;
    return `/project/${pid}/${item.path.replace(":id", String(pid))}`.replace(/\/$/, "");
  };

  const icon = (item: Item) => {
    if (item.icon) return item.icon;
    const Icon = resources[item.key]?.icon;
    return Icon ? <Icon /> : <DefaultIcon />;
  };

  const link = (item: Item) => (
    <MenuItemLink key={item.key} to={{ pathname: href(item) }} primaryText={item.label} leftIcon={icon(item)} />
  );

  return (
    <RAMenu {...props} sx={{ pt: "30px" }}>
      <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
        {/* The Dashboard is also where projects are switched and created. */}
        {selectedProject &&
          link({ key: "dashboard", label: "Dashboard", path: "", inProject: true, min: "viewer", icon: <DashboardIcon /> })}

        {GROUPS.map((g) => {
          const items = g.items.filter((i) => allowed(i) && (!i.inProject || selectedProject));
          if (!items.length) return null;
          return (
            <SubMenu
              key={g.key}
              isOpen={isOpen(g)}
              name={g.label}
              dense={false}
              handleToggle={() => toggle(g)}
              icon={g.icon}
            >
              {items.map(link)}
            </SubMenu>
          );
        })}
      </div>
    </RAMenu>
  );
};
