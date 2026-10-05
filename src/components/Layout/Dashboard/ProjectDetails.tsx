import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import { Divider, Link, ListItemIcon, MenuItem, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { usePermissions } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "../../../context/ProjectsContext";

const NEW = "new";

/**
 * The dashboard's heading, and the one place to switch projects — or start a
 * new one, which is the dropdown's last choice for those who can (owners and
 * admins; it used to be a menu item of its own).
 *
 * Switching lives here, deliberately one click away from everywhere else:
 * it changes what the whole admin shows, so it should feel like a choice,
 * not a stray click in the header (where a switcher used to be, and where
 * changing projects mid-page behaved oddly). It loads the chosen project's
 * dashboard as a fresh page, the way the project wizard does, so nothing
 * from the previous project lingers.
 */
const ProjectDetails = () => {
  const { selectedProject, projectsList } = useProjects();
  const { permissions } = usePermissions();
  const canCreate = permissions?.isSuperuser || ["owner", "admin"].includes(permissions?.role);

  // Restricted members see only the projects they are assigned.
  const allowed: number[] | null = permissions?.project_ids ?? null;
  const projects = (projectsList ?? []).filter((p) => !allowed || allowed.includes(p.id));

  const choose = (value: string) => {
    if (value === NEW) window.location.assign("/wizard");
    else if (Number(value) !== selectedProject?.id) window.location.assign(`/project/${Number(value)}`);
  };

  let control: React.ReactNode;
  if (!projects.length) {
    control = canCreate ? (
      <Typography variant="body1">
        None yet — <Link component={RouterLink} to="/wizard">create your first project</Link>.
      </Typography>
    ) : (
      <Typography variant="body1">None yet. An owner or admin of your organization can create one.</Typography>
    );
  } else if (projects.length === 1 && selectedProject && !canCreate) {
    // Nothing to choose between.
    control = (
      <Typography variant="h5" component="h2">
        {selectedProject.name}
      </Typography>
    );
  } else {
    control = (
      <TextField
        select
        variant="standard"
        value={selectedProject?.id ?? ""}
        onChange={(e) => choose(String(e.target.value))}
        sx={{ minWidth: 260, "& .MuiInputBase-input": { typography: "h5" } }}
        slotProps={{
          htmlInput: { "aria-label": "Selected project" },
          select: {
            displayEmpty: true,
            // Signed in with no project chosen yet (the admin's root page):
            // this is where the first one is picked.
            renderValue: selectedProject
              ? undefined
              : () => (
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
        {canCreate && <Divider />}
        {canCreate && (
          <MenuItem value={NEW}>
            <ListItemIcon>
              <AddCircleOutline fontSize="small" />
            </ListItemIcon>
            New project…
          </MenuItem>
        )}
      </TextField>
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
      {control}
    </Stack>
  );
};

export default ProjectDetails;
