import React, { useState, useEffect } from "react";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";
import { CircularProgress } from "@material-ui/core";
import { useBuildUI } from "providers/BuildUIContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";

interface UiItemNode {
  id: number;
  displayText: string;
  index: number | null;
  parent_id: number | null;
  children?: UiItemNode[];
}

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

const UIItemsTreeView = (): JSX.Element => {
  const { uiGroups } = useBuildUI();
  const dataProvider = useRoundwareDataProvider();

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
              id: item.id,
              parent_id: item.parent_id,
              index: item.index,
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

  const renderTreeItems = (items: UiItemNode[]) => {
    return items
      .sort((a, b) => (a > b ? -1 : 1))
      .map((i) => (
        <TreeItem key={i.id} nodeId={i.id?.toString()} label={i.displayText}>
          {Array.isArray(i.children) && renderTreeItems(i.children)}
        </TreeItem>
      ));
  };

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      expanded={uiItemsList.map((i) => i.id.toString())}
    >
      {loading ? <CircularProgress /> : renderTreeItems(uiItemsTree)}
    </TreeView>
  );
};

export default UIItemsTreeView;
