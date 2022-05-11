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
  Link,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { useProjects } from "providers/ProjectsContext";
import { AppBarProps, HideOnScroll } from "ra-ui-materialui";
import React, { memo, useState } from "react";
import { useRedirect, UserMenu, useUserMenu } from "react-admin";
import { SidebarToggleButton } from "./SidebarToggleButton";
const AppBar = (): JSX.Element => {
  const props = useUserMenu();
  const {
    className,
    color = "secondary",
    logout,

    title,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    classes: propsClasses,
    ...rest
  } = props;
  const classes = useStyles(props);
  const sidebarToggleButtonClasses = {
    menuButtonIconClosed: classes.menuButtonIconClosed,
    menuButtonIconOpen: classes.menuButtonIconOpen,
  };
  const isXSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm")
  );

  const redirect = useRedirect();
  const { projectsList, selectedProject, selectProject } = useProjects();

  const [isCreate, setIsCreate] = useState(false);

  const handleOnChange = (
    event: React.ChangeEvent<{}>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    child: React.ReactNode
  ) => {
    setIsCreate(false);
    const { value } = event.target;

    if (value == "none") {
      selectProject(null);
      return redirect(`list`, `/projects`);
    }
    if (value === "create") {
      setIsCreate(true);
      return redirect(`create`, `/projects`);
    }
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
            {selectedProject && (
              <SidebarToggleButton
                className={classes.menuButton}
                classes={sidebarToggleButtonClasses}
              />
            )}
            <Link
              onClick={(e) => {
                e.preventDefault();
                return redirect(`list`, `/projects`);
              }}
              href={`/#/projects`}
              style={{
                cursor: "pointer",
                color: "#fff",
                marginLeft: selectedProject ? 0 : 16,
              }}
              underline="hover"
            >
              {title}
            </Link>
            <InputLabel variant="standard" className={classes.label}>
              Project:{" "}
            </InputLabel>
            <FormControl className={classes.formControl}>
              <Select
                defaultValue={selectedProject?.id || "none"}
                id="grouped-select"
                className={classes.select}
                value={isCreate ? `create` : selectedProject?.id || "none"}
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
          <UserMenu />
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
      marginRight: 1,
      marginLeft: 2,
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
