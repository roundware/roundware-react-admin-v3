import React, { useEffect, useMemo, useState } from "react";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { ISpeaker } from "types/speaker";

export interface ISpeakerContext {
  selectedSpeaker: number | null;
  setSelectedSpeaker: React.Dispatch<React.SetStateAction<number | null>>;
  speakers?: ISpeaker[];
  fetchData: () => void;
}
export const SpeakerContext = React.createContext<ISpeakerContext>(undefined!);
export const useSpeakers = () => React.useContext(SpeakerContext);

export const SpeakersProvider = ({ children }: AllowChildrenOnlyProps) => {
  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null);
  const [speakers, setSpeakers] = useState<ISpeaker[]>();
  useEffect(() => {
    fetchData();
  }, [selectedProject?.id]);

  const fetchData = () => {
    dataProvider
      .getList(`speakers`, {
        pagination: {
          perPage: 0,
          page: 0,
        },
        sort: {
          field: "id",
          order: "ASC",
        },
        filter: {
          project_id: selectedProject?.id,
        },
      })
      .then((res) => setSpeakers(res.data as ISpeaker[]));
  };

  return (
    <SpeakerContext.Provider
      value={{
        selectedSpeaker,
        setSelectedSpeaker,
        speakers,
        fetchData,
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};
