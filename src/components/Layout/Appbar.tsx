import {
  AppBar as MuiAppBar,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Theme,
  Toolbar,
  useMediaQuery,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { memo } from "react";
import { UserMenu } from "react-admin";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useProjects } from "providers/ProjectsContext";
import { HideOnScroll, AppBarProps } from "ra-ui-materialui";
const AppBar = (props: AppBarProps): JSX.Element => {
  const {
    children,
    classes: classesOverride,
    className,
    color = "secondary",
    logout,
    open,
    title,
    userMenu,
    container: Container,
    ...rest
  } = props;
  const classes = useStyles(props);
  const sidebarToggleButtonClasses = {
    menuButtonIconClosed: classes.menuButtonIconClosed,
    menuButtonIconOpen: classes.menuButtonIconOpen,
  };
  const isXSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("xs")
  );

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

  return (
    <HideOnScroll>
      <MuiAppBar className={className} color={color} {...rest}>
        <Toolbar
          disableGutters
          variant={isXSmall ? "regular" : "dense"}
          className={classes.toolbar}
        >
          <div className={classes.leftContent}>
            <SidebarToggleButton
              className={classes.menuButton}
              classes={sidebarToggleButtonClasses}
            />
            {title}
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
          </div>
          <UserMenu logout={logout} />
        </Toolbar>
      </MuiAppBar>
    </HideOnScroll>
  );
};

const useStyles = makeStyles(
  (theme) => ({
    toolbar: {
      paddingRight: 24,
      flexGrow: 1,
      padding: 4,
      justifyContent: "space-between",
    },
    menuButton: {
      marginLeft: "0.2em",
      marginRight: "0.2em",
    },
    menuButtonIconClosed: {},
    menuButtonIconOpen: {},
    title: {
      flex: 1,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
    formControl: {
      minWidth: 140,
      borderColor: "rgba(255,255,255,0.8)",
    },
    select: {},
    label: {
      marginRight: theme.spacing(1),
      marginLeft: theme.spacing(2),
    },
    appBar: {},
    toolbarInner: {},
    leftContent: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
  }),
  { name: "RaAppBar" }
);

AppBar.defaultProps = {
  container: HideOnScroll,
};

export default memo(AppBar);
