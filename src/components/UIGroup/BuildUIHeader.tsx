import React from "react";
import { Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "context/ProjectsContext";

// The advanced editor's heading: this is the previous Filters & Menus page,
// kept for responses that depend on earlier ones (pages/FiltersMenus).
const BuildUIHeader = (): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <>
      <Typography variant="h5">Filters &amp; Menus: Advanced Editor</Typography>
      <Typography variant="subtitle2">
        For responses that only appear after a particular earlier response. Pick Speak or
        Listen, then a question in the tree on the right, and drag responses under the response
        they depend on. Everything else is simpler on the main{" "}
        <Link component={RouterLink} to={`/project/${selectedProject?.id}/uigroups`}>
          Filters &amp; Menus
        </Link>{" "}
        page.
      </Typography>
    </>
  );
};

export default BuildUIHeader;
