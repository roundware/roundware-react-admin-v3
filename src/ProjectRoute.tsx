import App, { BaseApp } from "App";
import SplashScreen from "components/Layout/SplashScreen";
import tokenAuthProvider from "context/AuthProvider";
import { useProjects } from "context/ProjectsContext";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

const CurrentProjectApp = App;
const ProjectRoute = () => {
  const { projectId } = useParams();
  const location = useLocation();

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
    return <CurrentProjectApp key={3} basename="" />;
  }
  const ids = process.env.REACT_APP_INCLUDE_PROJECT_IDS;
  const projectIdsArray = ids!.split(',');
  const selectedId = String(selectedProject?.id);
  const urlProjectId = location.pathname.split('/').pop();


  if (urlProjectId && !projectIdsArray.includes(urlProjectId)) {
    console.error(`ACCESS DENIED to id ${urlProjectId}`)
  } else if (projectIdsArray.includes(selectedId)) {
    console.log(`ACCESS GRANTED ${projectIdsArray} and ${selectedId}`);
  }

  if (selectedProject) {
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
