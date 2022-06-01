import React from "react";
import { DataProvider, fetchUtils } from "react-admin";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
import simpleRestProvider from "ra-data-simple-rest";
import { createOptionsFromToken } from "./AuthProvider";
export const dataProvider = simpleRestProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  (url, options = {}) => {
    options.user = createOptionsFromToken().user;

    return fetchUtils.fetchJson(url, options);
  },
  ""
);

export const RoundwareDataProviderContext =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  React.createContext<DataProvider>(undefined!);

export const useRoundwareDataProvider = (): DataProvider =>
  React.useContext(RoundwareDataProviderContext);

export const RoundwareDataProviderContextProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
  const rDataProvider: DataProvider = {
    ...dataProvider,
  };
  return (
    <RoundwareDataProviderContext.Provider value={rDataProvider}>
      {children}
    </RoundwareDataProviderContext.Provider>
  );
};
