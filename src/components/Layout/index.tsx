import { Toolbar } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect } from "react";
import {
  AppBar,
  Layout,
  AppBarProps,
  LayoutProps,
  Sidebar,
  SidebarProps,
  useRedirect,
  useSidebarState,
} from "react-admin";
import { useProjects } from "../../providers/ProjectsContext";
import Appbar from "./Appbar";
import { Menu } from "./Menu";

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: 140,

    borderColor: "rgba(255,255,255,0.8)",
  },
  select: {},
  label: {
    marginRight: 2,
  },
  appBar: {},
  toolbar: {
    flexGrow: 1,
  },
}));
const CustomAppBar = (props: AppBarProps) => {
  const classes = useStyles();
  const { projectsList, selectedProject, selectProject } = useProjects();

  const [open] = useSidebarState();
  return (
    <AppBar {...props} open={open} className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <InputLabel variant="standard" className={classes.label}>
          Project:{" "}
        </InputLabel>
        <FormControl className={classes.formControl}>
          <Select
            defaultValue={selectedProject?.id || "none"}
            id="grouped-select"
            className={classes.select}
            value={selectedProject?.id || "none"}
            onChange={(e, child) => {
              const { value } = e.target;
              if (!value) return;
              if (value === "create") return;
              selectProject(projectsList?.find((p) => p?.id === value) || null);
            }}
          >
            <MenuItem value="none">
              <em>None</em>
            </MenuItem>
            <MenuItem value={"create"}>Create New Project</MenuItem>
            {Array.isArray(projectsList) && projectsList.length > 0 && (
              <ListSubheader>Recent</ListSubheader>
            )}
            {projectsList?.map((p) => (
              <MenuItem key={p?.id} value={p?.id}>
                {p?.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};
const CustomSidebar = (props: SidebarProps) => {
  const { selectedProject } = useProjects();
  if (!selectedProject) return null;
  return <Sidebar {...props} />;
};

const CustomLayout = (props: LayoutProps): JSX.Element => {
  const { selectedProject } = useProjects();
  const redirect = useRedirect();
  useEffect(() => {
    if (!selectedProject) redirect(`list`, `/projects`);
    else redirect(`/`);
  }, [selectedProject]);
  return (
    <Layout
      {...props}
      appBar={Appbar}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sidebar={CustomSidebar}
      menu={Menu}
    />
  );
};

export default CustomLayout;
