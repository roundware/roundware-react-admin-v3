import { useRoundwareDataProvider } from "context/DataProviderContext";
import React, { useEffect, useState } from "react";
import { ISpeaker } from "types/speaker";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";

export interface ISpeakerContext {
  selectedSpeaker: number | null;
  setSelectedSpeaker: (newId: number | null) => void;
  setSpeakers: React.Dispatch<React.SetStateAction<ISpeaker[] | undefined>>;
  speakers?: ISpeaker[];
  fetchData: () => Promise<void>;
  setIsCurrentSpeakerSaved: React.Dispatch<React.SetStateAction<boolean>>;
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const SpeakerContext = React.createContext<ISpeakerContext>(undefined!);
export const useSpeakers = (): ISpeakerContext =>
  React.useContext(SpeakerContext);

export const SpeakersProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  const [selectedSpeaker, sSS] = useState<number | null>(null);
  const [speakers, setSpeakers] = useState<ISpeaker[]>();

  useEffect(() => {
    fetchData();
  }, [selectedProject?.id]);

  const [isCurrentSpeakerSaved, setIsCurrentSpeakerSaved] = useState(true);
  const setSelectedSpeaker = (newId: number | null) => {
    if (!isCurrentSpeakerSaved) {
      const ans = confirm(
        "Would you like to save your speaker changes before editing a new speaker?"
      );
      if (ans) return;
    }
    sSS(newId);
    setIsCurrentSpeakerSaved(true);
  };

  const fetchData = async () => {
    if (!selectedProject) return;
    await dataProvider
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
        setIsCurrentSpeakerSaved,
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};
