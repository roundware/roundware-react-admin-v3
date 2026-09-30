import { Link, MenuItem, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { usePermissions } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "../../../context/ProjectsContext";

/**
 * The dashboard's heading, and the one place to switch projects.
 *
 * Switching lives here, deliberately one click away from everywhere else:
 * it changes what the whole admin shows, so it should feel like a choice,
 * not a stray click in the header (where a switcher used to be, and where
 * changing projects mid-page behaved oddly). It loads the chosen project's
 * dashboard as a fresh page, the way the project wizard does, so nothing
 * from the previous project lingers.
 *
 * The "Edit Project" and "View Details" buttons that were here are gone: the
 * menu's "Project" item opens the project's settings.
 */
const ProjectDetails = () => {
  const { selectedProject, projectsList } = useProjects();
  const { permissions } = usePermissions();

  // Restricted members see only the projects they are assigned.
  const allowed: number[] | null = permissions?.project_ids ?? null;
  const projects = (projectsList ?? []).filter((p) => !allowed || allowed.includes(p.id));

  // Signed in with no project chosen yet (the admin's root page): this is
  // where the first one is picked, so always offer the list.
  if (!selectedProject) {
    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 0.5, sm: 1.5 }}
        alignItems={{ sm: "center" }}
        sx={{ color: "text.primary", p: 1.25, mt: 2, mb: 2 }}
      >
        <Typography variant="subtitle1" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          Selected project:
        </Typography>
        {projects.length ? (
          <TextField
            select
            variant="standard"
            value=""
            onChange={(e) => window.location.assign(`/project/${Number(e.target.value)}`)}
            sx={{ minWidth: 260, "& .MuiInputBase-input": { typography: "h5" } }}
            slotProps={{
              htmlInput: { "aria-label": "Selected project" },
              select: {
                displayEmpty: true,
                renderValue: () => (
                  <Typography variant="h5" component="span" color="text.secondary">
                    Choose a project
                  </Typography>
                ),
              },
            }}
          >
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Typography variant="body1">
            None yet — <Link component={RouterLink} to="/wizard">create your first project</Link>.
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.5, sm: 1.5 }}
      alignItems={{ sm: "center" }}
      sx={{ color: "text.primary", p: 1.25, mt: 2, mb: 2 }}
    >
      <Typography variant="subtitle1" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
        Selected project:
      </Typography>
      {projects.length > 1 ? (
        <TextField
          select
          variant="standard"
          value={selectedProject.id}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (id !== selectedProject.id) window.location.assign(`/project/${id}`);
          }}
          sx={{ minWidth: 260, "& .MuiInputBase-input": { typography: "h5" } }}
          slotProps={{ htmlInput: { "aria-label": "Selected project" } }}
        >
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Typography variant="h5" component="h2">
          {selectedProject.name}
        </Typography>
      )}
    </Stack>
  );
};

export default ProjectDetails;
