import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tokenAuthProvider from "./AuthProvider";
import { useRoundwareDataProvider } from "./DataProviderContext";
export interface IProject {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  auto_submit: boolean;
  max_recording_length_sec: number;
  listen_questions_dynamic: boolean;
  speak_questions_dynamic: boolean;
  sharing_url: string;
  out_of_range_url: string;
  recording_radius: number;
  listen_enabled: boolean;
  geo_listen_enabled: boolean;
  speak_enabled: boolean;
  geo_speak_enabled: boolean;
  reset_tag_defaults_on_startup: boolean;
  timed_asset_priority: boolean;
  repeat_mode: string;
  files_url: string;
  files_version: string;
  audio_stream_bitrate: string;
  ordering: string;
  demo_stream_enabled: false;
  demo_stream_url: string;
  out_of_range_distance: 10000;
  sharing_message: string;
  out_of_range_message: string;
  legal_agreement: string;
  demo_stream_message: string;
  language_ids: number[];
  /** "standard" | "looping" */
  recording_method?: string;
  /** Per-project config overrides; see roundware-server-v3/docs/009-configuration.md */
  ui_config_json?: Record<string, any>;
}
export interface IProjectsContext {
  selectedProject: IProject | null;
  projectsList: IProject[] | null;
  selectProject: (project: IProject | null) => void;
  setProjectsList: React.Dispatch<React.SetStateAction<IProject[] | null>>;
  refetch: () => Promise<void>;
}
 
const ProjectsContext = React.createContext<IProjectsContext>(undefined!);

export const useProjects = (): IProjectsContext =>
  React.useContext(ProjectsContext);

export interface AllowChildrenOnlyProps {
  children: React.ReactNode;
}
export const ProjectsProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const [project, setProject] = useState<IProject | null>(null);

  const [projectsList, setProjectsList] = useState<IProject[] | null>(null);
  const navigate = useNavigate();
  const selectProject = (project: IProject | null) => {
    if (dataProvider && project) dataProvider.currentProjectId = project?.id;
    setProject(project);
  };

  const refetch = useCallback(() =>
    dataProvider
      .getList<IProject>(`projects`, {
        filter: {},
        pagination: {
          perPage: 0,
          page: 0,
        },
        sort: {
          field: "id",
          order: "ASC",
        },
      })
      .then((r) => {
        if (r.data) {
          setProjectsList(r.data);
          if (project)
            setProject(r.data.find((p) => p.id == project.id) || null);
        }
      })
      .catch((e) => {
        console.error(e);
        tokenAuthProvider.logout({});
        navigate(`/`);
      }), [dataProvider, project, navigate]);

  // Initial fetch on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const slug = localStorage.getItem("tenant_slug");
    if (token && slug) {
      refetch();
    }
  }, []);

  // Re-fetch (or reset) when auth state changes (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("access_token");
      const slug = localStorage.getItem("tenant_slug");
      if (token && slug) {
        refetch();
      } else {
        // Logged out — clear stale project state
        setProjectsList(null);
        setProject(null);
      }
    };
    window.addEventListener("roundware-auth-change", handleAuthChange);
    return () => window.removeEventListener("roundware-auth-change", handleAuthChange);
  }, [refetch]);

  return (
    <ProjectsContext.Provider
      value={{
        selectedProject: project,
        projectsList,
        selectProject,
        setProjectsList,
        refetch,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
