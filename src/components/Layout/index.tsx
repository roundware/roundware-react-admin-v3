import { Toolbar } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import ListSubheader from "@material-ui/core/ListSubheader";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect } from "react";
import {
  AppBar,
  Layout,
  AppBarProps,
  LayoutProps,
  ReduxState,
  Sidebar,
  SidebarProps,
  useRedirect,
} from "react-admin";
import { useSelector } from "react-redux";
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
    marginRight: theme.spacing(1),
  },
  appBar: {},
  toolbar: {
    flexGrow: 1,
  },
}));
const CustomAppBar = (props: AppBarProps) => {
  const classes = useStyles();
  const { projectsList, selectedProject, selectProject } = useProjects();

  const handleOnChange = (
    event: React.ChangeEvent<{
      name?: string | undefined;
      value: unknown;
    }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    child: React.ReactNode
  ) => {
    const { value } = event.target;
    if (!value) return;
    if (value === "create") return;
    selectProject(projectsList?.find((p) => p?.id === value) || null);
  };
  const open = useSelector((state: ReduxState) => state.admin.ui.sidebarOpen);
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
            onChange={handleOnChange}
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
