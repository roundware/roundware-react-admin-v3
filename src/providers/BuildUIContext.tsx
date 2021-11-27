/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect, useState } from "react";
import { IUIGroup, UiItemNode } from "types/uiGroups";
import { useRoundwareDataProvider } from "./DataProviderContext";
import { AllowChildrenOnlyProps, useProjects } from "./ProjectsContext";

export interface IBuildUIContext {
  uiGroups: IUIGroup[];
  uiMode: IUIGroup[`ui_mode`];
  setUiMode: React.Dispatch<React.SetStateAction<IUIGroup[`ui_mode`]>>;
  refetchData: () => void;
  uiItemsTree: UiItemNode[];
  uiItemsList: UiItemNode[];
  loading: boolean;
  dummyPatchForGroup: (id: number) => Promise<void>;
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const BuildUIContext = React.createContext<IBuildUIContext>(undefined!);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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

  const [uiItemsTree, setUiItemsTree] = useState<UiItemNode[]>([]);
  const [uiItemsList, setUiItemsList] = useState<UiItemNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const uiItems: UiItemNode[] = [];
    const promises: Promise<void>[] = [];
    uiGroups.forEach((g) => {
      g.ui_items.forEach((item) => {
        const prom = dataProvider
          .getOne(`tags`, {
            id: item.tag_id,
          })
          .then((res) => {
            uiItems.push({
              ...item,
              id: item.id,
              displayText: res.data.value,
            });
          });
        promises.push(prom);
      });
    });
    Promise.all(promises).then(() => {
      setUiItemsList(uiItems);
      setUiItemsTree(list_to_tree(uiItems));
      setLoading(false);
    });
  }, [uiGroups]);

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

  const dummyPatchForGroup = async (id: number) => {
    /** hack to get latest ui group object into cached resources */
    await dataProvider.update(`uigroups`, {
      id,
      data: {
        note: `dummay patch request to get latest data into cached resources`,
      },
      previousData: uiGroups.find((g) => g.id == id)!,
    });
  };

  return (
    <BuildUIContext.Provider
      value={{
        uiGroups,
        uiMode,
        setUiMode,
        refetchData,
        uiItemsTree,
        uiItemsList,
        loading,
        dummyPatchForGroup,
      }}
    >
      {children}
    </BuildUIContext.Provider>
  );
};

function list_to_tree(list: UiItemNode[]) {
  // eslint-disable-next-line prefer-const
  let map: {
    [index: number]: number;
  } = {};
  let node: UiItemNode, i: number;

  const roots: UiItemNode[] = [];
  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parent_id !== null) {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node?.parent_id]]?.children?.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
