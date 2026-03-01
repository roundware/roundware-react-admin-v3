import { Box, Typography } from "@mui/material";
import * as React from "react";
import { EditButton, ShowButton } from "react-admin";
import { useCanEdit } from "../../../hooks/useCanEdit";
import { useProjects } from "../../../context/ProjectsContext";

const ProjectDetails = () => {
  const { selectedProject } = useProjects();
  const canEdit = useCanEdit();
  if (!selectedProject) return null;
  return (
    <Box
      display="flex"
      sx={{
        color: 'text.primary',
        padding: 1.25,
        marginTop: 2,
        marginBottom: '1em'
      }}
    >
      <Box flex="1">
        <Typography variant="h5" component="h2" gutterBottom>
          {selectedProject?.name}
        </Typography>
      </Box>
      <Box>
        {canEdit && (
          <EditButton
            resource="projects"
            label="Edit Project"
            record={selectedProject}
          />
        )}
        <ShowButton
          resource="projects"
          label="View Details"
          record={selectedProject}
        />
      </Box>
    </Box>
  );
};

export default ProjectDetails;
