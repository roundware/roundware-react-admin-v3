import { UseBooleanType } from "hooks/useBoolean";
import React, { PropsWithChildren } from "react";
const BooleanContext = React.createContext<UseBooleanType>(undefined!);
export const BooleanContextProvider = ({
  children,
  boolean,
}: PropsWithChildren<{
  boolean: UseBooleanType;
}>) => {
  <BooleanContext.Provider value={boolean}>{children}</BooleanContext.Provider>;
};

export const useRedirectContext = React.useContext(BooleanContext);
export const useBooleanContext = React.useContext(BooleanContext);
