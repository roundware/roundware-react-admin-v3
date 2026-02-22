import {
  AppBar as MuiAppBar,
  FormControl,
  InputLabel,
  Link,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Theme,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import { useProjects } from "context/ProjectsContext";
import React, { memo, useState } from "react";
import { HideOnScroll, useRedirect, UserMenu } from "react-admin";
import { useNavigate } from "react-router-dom";
import RefreshButton from "./RefreshButton";
import { SidebarToggleButton } from "./SidebarToggleButton";
const AppBar = (): JSX.Element => {
  const isXSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm")
  );

  const redirect = useRedirect();
  const { projectsList, selectedProject, selectProject } = useProjects();

  const [isCreate, setIsCreate] = useState(false);
  const navigate = useNavigate();
  const handleOnChange = (event: SelectChangeEvent<string | number>) => {
    setIsCreate(false);
    const { value } = event.target;

    if (value == "none") {
      selectProject(null);
      return navigate(`/projects`);
    }
    if (value === "create") {
      setIsCreate(true);
      selectProject(null);
      return navigate(`/projects/create`);
    }
    selectProject(projectsList?.find((p) => p?.id === value) || null);
    if ([`none`, `create`].includes(value.toString())) return;
    navigate(`/project/${value}`);
  };

  const possibleProjects = (
    process.env.REACT_APP_INCLUDE_PROJECT_IDS || "all"
  ).split(`,`);

  return (
    <HideOnScroll>
      <MuiAppBar color={"secondary"} sx={{ padding: 1 }} position="fixed">
        <Toolbar
          disableGutters
          variant={isXSmall ? "regular" : "dense"}
          sx={{ justifyContent: "space-between" }}
        >
          <Stack spacing={2} direction="row" alignItems="center">
            {selectedProject && <SidebarToggleButton />}
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
              Roundware Admin
            </Link>
            <Stack direction="row" spacing={1} alignItems="center">
              <InputLabel variant="standard">Project: </InputLabel>
              <FormControl>
                <Select
                  defaultValue={selectedProject?.id || "none"}
                  id="grouped-select"
                  value={isCreate ? `create` : selectedProject?.id || "none"}
                  onChange={handleOnChange}
                  size="small"
                >
                  <MenuItem value="none">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={"create"}>Create New Project</MenuItem>
                  {Array.isArray(projectsList) && projectsList.length > 0 && (
                    <ListSubheader>Recent</ListSubheader>
                  )}
                  {projectsList
                    ?.filter((p) => {
                      if (possibleProjects.includes("all")) return true;
                      return possibleProjects.includes(p.id.toString());
                    })
                    .map((p) => (
                      <MenuItem key={p?.id} value={p?.id}>
                        {p?.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
          <Stack spacing={1} direction="row">
            <RefreshButton />
            <UserMenu />
          </Stack>
        </Toolbar>
      </MuiAppBar>
    </HideOnScroll>
  );
};

AppBar.defaultProps = {
  container: HideOnScroll,
};

export default memo(AppBar);
