import React, { useEffect, useState } from "react";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { ISpeaker } from "types/speaker";
import { useResourceContext } from "react-admin";

export interface ISpeakerContext {
  selectedSpeaker: number | null;
  setSelectedSpeaker: React.Dispatch<React.SetStateAction<number | null>>;
  setSpeakers: React.Dispatch<React.SetStateAction<ISpeaker[] | undefined>>;
  speakers?: ISpeaker[];
  fetchData: () => void;
}
export const SpeakerContext = React.createContext<ISpeakerContext>(undefined!);
export const useSpeakers = () => React.useContext(SpeakerContext);

export const SpeakersProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
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
        setSpeakers,
        fetchData,
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};
