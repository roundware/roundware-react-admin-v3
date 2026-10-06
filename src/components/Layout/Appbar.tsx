import {
    Box,
    Divider,
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
import { HideOnScroll, usePermissions, UserMenu } from "react-admin";
import { useNavigate } from "react-router-dom";
import { SidebarToggleButton } from "./SidebarToggleButton";
import TenantSelector from "./TenantSelector";
interface AppBarProps {
  container?: React.ComponentType<any>;
}

const AppBar = ({ container = HideOnScroll }: AppBarProps): JSX.Element => {
  const isXSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm")
  );

  const { permissions } = usePermissions();
  const { selectedProject } = useProjects();

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
            {/* Home: the current project's dashboard. (It went to the
                all-projects list, which is now for superusers only.) */}
            <Link
              onClick={(e) => {
                e.preventDefault();
                navigate(selectedProject ? `/project/${selectedProject.id}` : "/");
              }}
              href={selectedProject ? `/project/${selectedProject.id}` : "/"}
              style={{
                cursor: "pointer",
                color: "#fff",
                marginLeft: selectedProject ? 0 : 16,
              }}
              // Quieter than the project beside it: the product, not the place.
              sx={{ fontSize: "0.95rem", opacity: 0.8, whiteSpace: "nowrap" }}
              underline="hover"
            >
              Roundware Admin
            </Link>
            {/* The project switcher used to be a Select here. Changing it
                swapped the whole admin's context mid-page — including the
                router basename — which read as the app behaving oddly rather
                than as a deliberate switch. The name is kept for orientation;
                switching happens deliberately, on the Dashboard. It was set
                like the "Roundware Admin" beside it and read as part of it;
                now it is labeled, divided off and set larger. */}
            {selectedProject && (
              <>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: "rgba(255,255,255,0.45)", my: 0.5 }}
                />
                <Box sx={{ minWidth: 0, color: "#fff", lineHeight: 1.1 }}>
                  {!isXSmall && (
                    <Typography
                      variant="overline"
                      component="div"
                      sx={{ fontSize: "0.65rem", lineHeight: 1.2, letterSpacing: "0.1em", opacity: 0.75 }}
                    >
                      Project
                    </Typography>
                  )}
                  <Typography
                    variant="h6"
                    component="div"
                    title={selectedProject.name}
                    sx={{
                      fontWeight: 600,
                      fontSize: "1.15rem",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 160, sm: 360, md: 520 },
                    }}
                  >
                    {selectedProject.name}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
          <Stack spacing={1} direction="row" alignItems="center">
            <TenantSelector />
            <UserMenu />
          </Stack>
        </Toolbar>
      </MuiAppBar>
    </HideOnScroll>
  );
};


export default memo(AppBar);
