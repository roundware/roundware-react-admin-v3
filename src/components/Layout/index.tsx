import {
  Layout,
  AppBar,
  MenuItemLink,
  UserMenu,
  AppBarProps,
  LayoutProps,
  Sidebar,
  SidebarProps
} from "react-admin";
import { ComponentType, forwardRef, useCallback } from "react";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import ListSubheader from "@material-ui/core/ListSubheader";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { FormHelperText, TextField, Toolbar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useProjects } from "../../providers/ProjectsContext";

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: 140,

    borderColor: "rgba(255,255,255,0.8)",
  },
  select: {},
  label: {
    marginRight: theme.spacing(1),
  },
  appBar: {

  },
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
    child: React.ReactNode
  ) => {
    const { value } = event.target;
    if (!value) return;
    if (value === "create") return;
    selectProject(projectsList?.find((p) => p?.id === value) || null);
  };

  return (
    <AppBar {...props} className={classes.appBar}>
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
              <MenuItem value={p?.id}>{p?.name}</MenuItem>
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
  return <Sidebar {...props}  />
}


const CustomLayout = (props: LayoutProps) => {
  
  return (<Layout {...props}   appBar={CustomAppBar}
    // @ts-ignore
    sidebar={CustomSidebar}
  />);
}

export default CustomLayout;
