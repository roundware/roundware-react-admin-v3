import React, { useState, useEffect } from "react";
export interface IProject {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  pub_date: string;
  audio_format: string;
  auto_submit: boolean;
  max_recording_length: number;
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
}
export interface IProjectsContext {
  selectedProject: IProject | null;
  projectsList: IProject[] | null;
  selectProject: React.Dispatch<React.SetStateAction<IProject | null>>;
  setProjectsList: React.Dispatch<React.SetStateAction<IProject[] | null>>;
}
const ProjectsContext = React.createContext<IProjectsContext>(undefined!);

export const useProjects = () => React.useContext(ProjectsContext);

interface SelectedProjectProviderProps {
  children: React.ReactNode;
}
export const ProjectsProvider = ({
  children,
}: SelectedProjectProviderProps) => {

  const [project, setProject] = useState<IProject | null>(null);

  const [projectsList, setProjectsList] = useState<IProject[] | null>(null);

  return (
    <ProjectsContext.Provider
      value={{
        selectedProject: project,
        projectsList,
        selectProject: setProject,
        setProjectsList,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
