/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect, useState } from "react";
import { ITag } from "types/tags";
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
  getTagsForGroup: (groupId: number) => Promise<ITag[]>;
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
    /** first get all the tags to avoid cachine issue */
    dataProvider
      .getList(`tags`, {
        filter: {},
        sort: {
          field: `id`,
          order: `ASC`,
        },
        pagination: {
          perPage: 0,
          page: 0,
        },
      })
      .then(() =>
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
        })
      )
      .then(() =>
        Promise.all(promises).then(() => {
          setUiItemsList(uiItems);
          setUiItemsTree(list_to_tree(uiItems));
          setLoading(false);
        })
      );
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

  /** gets all the possible tag for a group. determined by category */
  const getTagsForGroup = async (groupId: number): Promise<ITag[]> => {
    /** find that ui gorup */
    const uiGroup = uiGroups.find((g) => g.id == groupId);
    /** group not found return empty */
    if (!uiGroup) return [];

    /** get tags filtered by tag_category of that group */

    const {
      data,
    }: {
      data: ITag[];
    } = await dataProvider.getList(`tags`, {
      filter: {
        tag_category_id: uiGroup.tag_category_id,
      },
      pagination: {
        perPage: 0,
        page: 0,
      },
      sort: {
        field: "id",
        order: `ASC`,
      },
    });

    return data.filter(
      (t: ITag) => t.tag_category_id == uiGroup.tag_category_id
    );
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
        getTagsForGroup,
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
