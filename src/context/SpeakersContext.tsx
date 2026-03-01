import { useRoundwareDataProvider } from "context/DataProviderContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ISpeaker } from "types/speaker";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";

export interface ISpeakerContext {
  selectedSpeaker: number | null;
  setSelectedSpeaker: (newId: number | null) => void;
  setSpeakers: React.Dispatch<React.SetStateAction<ISpeaker[] | undefined>>;
  speakers?: ISpeaker[];
  fetchData: () => Promise<void>;
  setIsCurrentSpeakerSaved: React.Dispatch<React.SetStateAction<boolean>>;
  speakersWithoutShape: (ISpeaker & {
    isNewlyCreated: boolean;
  })[];
  addToNewlyCreatedSpeakers: (speakerId: number) => void;
}
 
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

  const [isCurrentSpeakerSaved, _setIsCurrentSpeakerSaved] = useState(true);
  // Ref mirrors state so that setSelectedSpeaker always reads the latest value,
  // even when called from a .then() callback where React has batched setState.
  const savedRef = useRef(true);
  const setIsCurrentSpeakerSaved = (val: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof val === "function" ? val(savedRef.current) : val;
    savedRef.current = resolved;
    _setIsCurrentSpeakerSaved(resolved);
  };
  const setSelectedSpeaker = (newId: number | null) => {
    // Only check for unsaved changes if we're switching to a different speaker
    if (newId !== selectedSpeaker && !savedRef.current) {
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

  const [newlyCreatedSpeakerIds, setNewlyCreatedSpeakerIds] = useState<
    number[]
  >([]);

  const addToNewlyCreatedSpeakers = (speakerId: number) => {
    setNewlyCreatedSpeakerIds((prev) => [...prev, speakerId]);
  };

  const speakersWithoutShape = useMemo(() => {
    return (speakers || [])
      .filter((s) => !s.shape)
      .map((s) => {
        return {
          ...s,
          isNewlyCreated: newlyCreatedSpeakerIds.some((n) => n == s.id),
        };
      });
  }, [speakers, newlyCreatedSpeakerIds]);

  return (
    <SpeakerContext.Provider
      value={{
        selectedSpeaker,
        setSelectedSpeaker,
        speakers,
        setSpeakers,
        fetchData,
        setIsCurrentSpeakerSaved,
        speakersWithoutShape,
        addToNewlyCreatedSpeakers,
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};
