import {
    Link,
    AppBar as MuiAppBar,
    Stack,
    Theme,
    Toolbar,
    Typography,
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
            {/* The project switcher used to be a Select here. Changing it
                swapped the whole admin's context mid-page — including the
                router basename — which read as the app behaving oddly rather
                than as a deliberate switch. The name is kept for orientation;
                switching happens on the Projects list, reached from the title
                link, where the choice is the point of the page. */}
            {selectedProject && (
              <Typography variant="subtitle1" sx={{ color: "#fff", opacity: 0.9 }}>
                {selectedProject.name}
              </Typography>
            )}
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
