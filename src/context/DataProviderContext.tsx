import React from "react";
import { RoundwareDataProvider } from "roundwareDataProvider";
import { fetcher } from "roundwareDataProvider/tokenAuthProvider";
import { AllowChildrenOnlyProps } from "./ProjectsContext";

export const dataProvider = new RoundwareDataProvider(
  `${import.meta.env.VITE_SERVER_URL}/api/3`,
  fetcher,
  false
);

export const RoundwareDataProviderContext =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  React.createContext<RoundwareDataProvider>(undefined!);

export const useRoundwareDataProvider = (): RoundwareDataProvider =>
  React.useContext(RoundwareDataProviderContext);

export const RoundwareDataProviderContextProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
  return (
    <RoundwareDataProviderContext.Provider value={dataProvider}>
      {children}
    </RoundwareDataProviderContext.Provider>
  );
};
