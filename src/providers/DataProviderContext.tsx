import React from "react";
import { DataProvider, fetchUtils, Options } from "react-admin";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
import { RoundwareDataProvider } from "ra-data-roundware-drf";
import { createOptionsFromToken } from "./AuthProvider";
export const dataProvider = new RoundwareDataProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  (url: string, options: Options = {}) => {
    options.user = createOptionsFromToken().user;

    return fetchUtils.fetchJson(url, options);
  },
  false
);

export const RoundwareDataProviderContext =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  React.createContext<DataProvider>(undefined!);

export const useRoundwareDataProvider = (): DataProvider =>
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
