import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import App, { BaseApp } from './App';
import AccessDenied from './components/Layout/AccessDenied';
import SplashScreen from './components/Layout/SplashScreen';
import tokenAuthProvider from './context/AuthProvider';
import { useProjects } from './context/ProjectsContext';

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
    return <CurrentProjectApp key={3} basename='' />;
  }
  const ids = import.meta.env.VITE_INCLUDE_PROJECT_IDS;
  const projectIdsArray = (ids || '').split(',');

  if (
    ids !== 'all' &&
    selectedProject &&
    !projectIdsArray.some(
      (id: string) => id.toString() === selectedProject.id.toString()
    )
  ) {
    return <AccessDenied />;
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
