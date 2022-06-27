import React, { PropsWithChildren } from "react";
type Props = {
  progress: number;
  // setProgress: (newProgress: number) => void
};
const ProgressContext = React.createContext<Props>({
  progress: 0,
  // setProgress: (newProgress: number) => {}
});

export const useProgress = () => React.useContext(ProgressContext);

export const ProgressProvider = ({
  progress,
  children,
}: PropsWithChildren<Props>) => {
  return (
    <ProgressContext.Provider
      value={{
        progress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
