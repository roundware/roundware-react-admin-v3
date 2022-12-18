import { RoundwareDataProvider } from "roundwareDataProvider";
import React from "react";
import { fetchUtils, Options } from "react-admin";
import { createOptionsFromToken } from "./AuthProvider";
import { AllowChildrenOnlyProps } from "./ProjectsContext";
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
