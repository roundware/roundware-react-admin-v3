import React from "react";
import {
  fetchJsonWithAuthToken,
  RoundwareDataProvider,
} from "ra-data-roundware-drf";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
const dataProvider = new RoundwareDataProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

export const RoundwareDataProviderContext =
  React.createContext<RoundwareDataProvider>(undefined!);

export const useRoundwareDataProvider = () =>
  React.useContext(RoundwareDataProviderContext);

export const RoundwareDataProviderContextProvider = ({
  children,
}: AllowChildrenOnlyProps) => {
  return (
    <RoundwareDataProviderContext.Provider value={dataProvider}>
      {children}
    </RoundwareDataProviderContext.Provider>
  );
};
