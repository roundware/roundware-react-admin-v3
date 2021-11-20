import React, { useCallback, useEffect, useState } from "react";
import { IUIGroup } from "types/uiGroups";
import { useRoundwareDataProvider } from "./DataProviderContext";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";

export interface IBuildUIContext {
  uiGroups: IUIGroup[];
  uiMode: IUIGroup[`ui_mode`];
  setUiMode: React.Dispatch<React.SetStateAction<IUIGroup[`ui_mode`]>>;
  refetchData: () => void;
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const BuildUIContext = React.createContext<IBuildUIContext>(undefined!);
export const useBuildUI = () => React.useContext(BuildUIContext);

export const BuildUIContextProvider = ({
  children,
}: AllowChildrenOnlyProps): JSX.Element => {
  const [fetchedData, setFetchedData] = useState<IUIGroup[]>([]);

  const [uiGroups, setUiGroups] = useState<IUIGroup[]>([]);
  const [uiMode, setUiMode] = useState<IUIGroup[`ui_mode`]>("speak");

  const dataProvider = useRoundwareDataProvider();
  const { selectedProject } = useProjects();
  useEffect(() => {
    refetchData();
  }, [selectedProject]);

  useEffect(() => {
    setUiGroups(fetchedData.filter((g) => g.ui_mode == uiMode));
  }, [uiMode, fetchedData]);

  const refetchData = useCallback(() => {
    dataProvider
      .getList(`uigroups`, {
        pagination: {
          perPage: 0,
          page: 0,
        },
        filter: {
          project_id: selectedProject?.id,
        },
        sort: {
          field: "index",
          order: "ASC",
        },
      })
      .then((res) => setFetchedData(res.data as IUIGroup[]));
  }, [selectedProject]);

  return (
    <BuildUIContext.Provider
      value={{
        uiGroups,
        uiMode,
        setUiMode,
        refetchData,
      }}
    >
      {children}
    </BuildUIContext.Provider>
  );
};
