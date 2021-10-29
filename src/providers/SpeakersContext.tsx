import React, { useState } from "react";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
export interface ISpeakerContext {
  selectedSpeaker: number | null;
  setSelectedSpeaker: React.Dispatch<React.SetStateAction<number | null>>;
  speakers?: [];
}
export const SpeakerContext = React.createContext<ISpeakerContext>(undefined!);
export const useSpeakers = () => React.useContext(SpeakerContext);

export const SpeakersProvider = ({ children }: AllowChildrenOnlyProps) => {
  const dataProvider = useRoundwareDataProvider();
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null);

  return (
    <SpeakerContext.Provider
      value={{
        selectedSpeaker,
        setSelectedSpeaker,
      }}
    >
      {children}
    </SpeakerContext.Provider>
  );
};
