import {
    FormControl,
    InputLabel,
    Link,
    ListSubheader,
    MenuItem,
    AppBar as MuiAppBar,
    Select,
    SelectChangeEvent,
    Stack,
    Theme,
    Toolbar,
    useMediaQuery,
} from "@mui/material";
import { useProjects } from "context/ProjectsContext";
import React, { memo } from "react";
import { HideOnScroll, usePermissions, useRedirect, UserMenu } from "react-admin";
import { useNavigate } from "react-router-dom";
import RefreshButton from "./RefreshButton";
import { SidebarToggleButton } from "./SidebarToggleButton";
import TenantSelector from "./TenantSelector";
interface AppBarProps {
  container?: React.ComponentType<any>;
}

const AppBar = ({ container = HideOnScroll }: AppBarProps): JSX.Element => {
  const isXSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm")
  );

  const redirect = useRedirect();
  const { permissions } = usePermissions();
  const { projectsList, selectedProject, selectProject } = useProjects();

  const navigate = useNavigate();
  const handleOnChange = (event: SelectChangeEvent<string | number>) => {
    const { value } = event.target;

    if (value == "none") {
      selectProject(null);
      return navigate(`/projects`);
    }
    if (value === "create") {
      return navigate(`/wizard`);
    }
    selectProject(projectsList?.find((p) => p?.id === value) || null);
    if ([`none`, `create`].includes(value.toString())) return;
    navigate(`/project/${value}`);
  };

  const possibleProjects = (
    import.meta.env.VITE_INCLUDE_PROJECT_IDS || "all"
  ).split(`,`);

  // User's allowed project IDs from auth (null = unrestricted)
  const allowedProjectIds: number[] | null = permissions?.project_ids ?? null;

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
                  value={selectedProject?.id || "none"}
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
                      // Always show the currently selected project in the dropdown
                      if (selectedProject && p.id === selectedProject.id) return true;
                      // Env-based filter (VITE_INCLUDE_PROJECT_IDS)
                      if (!possibleProjects.includes("all") && !possibleProjects.includes(p.id.toString())) return false;
                      // User-level project access filter
                      if (allowedProjectIds !== null && !allowedProjectIds.includes(p.id)) return false;
                      return true;
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
          <Stack spacing={1} direction="row" alignItems="center">
            <TenantSelector />
            <RefreshButton />
            <UserMenu />
          </Stack>
        </Toolbar>
      </MuiAppBar>
    </HideOnScroll>
  );
};


export default memo(AppBar);
