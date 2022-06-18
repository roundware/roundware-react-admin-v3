import { LinearProgress } from "@mui/material";
import App from "App";
import tokenAuthProvider from "providers/AuthProvider";
import { useProjects } from "providers/ProjectsContext";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-admin";
import { useParams } from "react-router-dom";

const ProjectRoute = () => {
  const { projectId } = useParams();
  const { selectProject, projectsList } = useProjects();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    tokenAuthProvider
      .checkAuth({})
      .then(() => {
        if (!projectsList) return;
        if (!projectId) return setLoading(false);
        selectProject(
          projectsList.find((p) => p.id == Number(projectId)) || null
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectsList]);

  if (loading) return <LinearProgress />;

  return <App />;
};

export default ProjectRoute;
