import App, { BaseApp } from "App";
import SplashScreen from "components/Layout/SplashScreen";
import tokenAuthProvider from "context/AuthProvider";
import { useProjects } from "context/ProjectsContext";
import React, { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";

const CurrentProjectApp = App;
const ProjectRoute = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectProject, projectsList, selectedProject } = useProjects();
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

  if (loading) return <SplashScreen />;
  const isCurrentProjectRoute =
    selectedProject && location.pathname.includes(`projects`);

  if (isCurrentProjectRoute && location.pathname.includes(`project/`)) {
    return (
      <Navigate
        to={location.pathname.slice(location.pathname.indexOf(`/projects`))}
      />
    );
  }
  if (isCurrentProjectRoute) {
    console.log(`isCurrentProjectSelected`);
    return <CurrentProjectApp key={3} basename="" />;
  }

  if (selectedProject) {
    console.log(`!selectedButNeedsBaseApp`);
    return (
      <>
        <App key={1} basename={`/project/${selectedProject?.id}`} />
      </>
    );
  }

  return (
    <>
      <BaseApp key={2} basename={``} />
    </>
  );
};

export default ProjectRoute;
