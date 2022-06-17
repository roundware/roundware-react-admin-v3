import { LinearProgress } from "@mui/material";
import App from "App";
import { useProjects } from "providers/ProjectsContext";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-admin";
import { useParams } from "react-router-dom";

const ProjectRoute = () => {
  const { isLoading, authenticated } = useAuthState();
  const { projectId } = useParams();
  const { selectProject, projectsList } = useProjects();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoading) return;
    if (!authenticated) return setLoading(false);
    if (!projectsList) return;
    if (!projectId) return setLoading(false);
    selectProject(projectsList.find((p) => p.id == Number(projectId)) || null);
    setLoading(false);
  }, [isLoading, projectsList]);

  if (isLoading || loading) return <LinearProgress />;

  return <App />;
};

export default ProjectRoute;
