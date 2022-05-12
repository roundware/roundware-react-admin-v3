/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  LinearProgress,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DragHandleSharpIcon from "@mui/icons-material/DragHandleSharp";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeItem from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { useBuildUI } from "providers/BuildUIContext";
import React, { useCallback, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
  OnDragStartResponder,
} from "react-beautiful-dnd";
import { UiItemNode } from "types/uiGroups";
import TreeItemLabel from "./TreeItemLabel";
import { UpdateResult, RaRecord, useRefresh, useNotify } from "react-admin";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
const UIItemsTreeView = (): JSX.Element => {
  const {
    uiItemsTree,
    loading,
    uiGroups,
    uiItemsList,
    dummyPatchForGroup,
    refetchData,
  } = useBuildUI();
  const dataProvider = useRoundwareDataProvider();
  const [reorderingGroup, setReorderingGroup] = useState<number | undefined>();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const refresh = useRefresh();
  const notify = useNotify();

  const collapseItem = (id: number) => {
    setExpandedItems((prev) => {
      return [...prev].filter((pi) => pi !== id.toString());
    });
  };
  const expandItem = (id: number) => {
    setExpandedItems((prev) => {
      return [...prev, id.toString()];
    });
  };

  const classes = useStyles();

  const renderTreeItems = useCallback(
    (items: UiItemNode[]) => {
      if (!items.length) return null;
      const droppableId =
        items?.[0]?.ui_group_id?.toString() +
        "-" +
        items?.[0]?.parent_id?.toString();

      const group = uiGroups.find((g) => g.id == items?.[0]?.ui_group_id);
      if (!group) return null;
      return (
        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={hanldeDragStart}
        >
          <Droppable droppableId={droppableId}>
            {(provided, snapshot) => {
              return (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    border: snapshot.isDraggingOver
                      ? `1px dashed green`
                      : `none`,
                    padding: snapshot.isDraggingOver ? 3 : 4,
                    borderRadius: 8,
                  }}
                >
                  <Typography variant="caption">
                    {group.index}. {group.header_text_loc}
                  </Typography>
                  {items
                    .sort((a, b) => (a!.index! > b!.index! ? 1 : -1))
                    .map((i) => (
                      <Draggable
                        key={i.id}
                        draggableId={i.id.toString()}
                        index={i.index!}
                      >
                        {(provided, snapshot) => (
                          <TreeItem
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            nodeId={i.id?.toString()}
                            className={classes.treeItem}
                            classes={{
                              group: classes.treeItemGroup,
                            }}
                            label={
                              reorderingGroup == group.id ? (
                                <LinearProgress />
                              ) : (
                                <TreeItemLabel
                                  uiItem={i}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              )
                            }
                            collapseIcon={
                              <ExpandMoreIcon
                                onClick={() => collapseItem(i.id)}
                              />
                            }
                            expandIcon={
                              <ChevronRightIcon
                                onClick={() => expandItem(i.id)}
                              />
                            }
                          >
                            {Array.isArray(i.children) &&
                              renderTreeItems(i.children)}
                          </TreeItem>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        </DragDropContext>
      );
    },
    [reorderingGroup, uiGroups]
  );

  const [selectedUiGroup, setSelectedUiGroup] = useState<number | null>(
    uiGroups[uiGroups.length - 1]?.id
  );

  const selectUiGroupId = (id: number) => {
    setSelectedUiGroup(id);
    const newExpanded = uiItemsList
      ?.filter((i) => {
        const index = uiGroups.findIndex((g) => g.id == i.ui_group_id);
        const selectedsIndex = uiGroups.findIndex((g) => g.id == id);
        if (selectedsIndex > index) return true;
        return false;
      })
      ?.map((i) => i?.id?.toString());
    setExpandedItems(newExpanded);
  };

  const handleDragEnd: OnDragEndResponder = (provided, snapshop) => {
    /** source and destination index */
    const { source, destination, draggableId } = provided;

    /** not destination nothing changed return go home tata byebye */
    if (!destination?.index) return;

    // find the item which is moved
    const draggedItem = uiItemsList.find((g) => g.id == Number(draggableId));
    if (!draggedItem) return;

    // detemine direction:
    // if positive then moved downwards and negative upwards
    const movedDirection =
      destination!.index - source.index < 0 ? `up` : `down`;

    console.log(movedDirection);

    // promises of dataProvider calls
    const promises: Promise<UpdateResult<RaRecord>>[] = [];

    // list of items need to possibly modified
    const possiblyAffectedItems = uiItemsList.filter(
      (i) =>
        i.ui_group_id == draggedItem.ui_group_id &&
        i.parent_id == draggedItem.parent_id
    );
    // loop through sus
    possiblyAffectedItems.forEach((i) => {
      let newIndex: number | null = null;

      /** its the same element just update with whatever destination */
      if (i.id == draggedItem.id) {
        newIndex = destination.index;
      } else if (
        /** find if its affected and increment or decrement its index */
        movedDirection == "up" &&
        i.index >= destination!.index &&
        i.index <= source!.index
      ) {
        newIndex = i.index + 1;
      } else if (
        movedDirection == "down" &&
        i.index <= destination!.index &&
        i.index >= source.index
      ) {
        newIndex = i.index - 1;
      }

      /** if its affected  */
      if (typeof newIndex == "number") {
        console.log(i, i.index, `changed to`, newIndex);
        const prom = dataProvider.update(`uiitems`, {
          data: {
            index: newIndex,
          },
          id: i.id,
          previousData: i,
        });
        promises.push(prom);
      }
    });

    setReorderingGroup(draggedItem.ui_group_id);
    Promise.all(promises)
      .then(() => dummyPatchForGroup(draggedItem.ui_group_id))
      .then(() => refetchData())
      .then(() => notify(`Changed UI Items order`, `info`))
      .catch(() =>
        notify(
          `Couldn't change order. Something went wrong. Please try again.`,
          `error`
        )
      )
      .finally(() => setReorderingGroup(undefined));
  };

  /** when drag start collapse those items */
  const hanldeDragStart: OnDragStartResponder = (provided, snapshot) => {
    const uiGroupId = Number(provided.source.droppableId?.split(`-`)[0]);
    const foundGroup = uiGroups.find((g) => g.id == uiGroupId);

    foundGroup?.ui_items?.forEach((i) => {
      collapseItem(i.id);
    });
  };

  return (
    <Grid container spacing={3} direction="column">
      <Grid item xs={12} alignItems="center">
        <Typography variant="h6">Organize UI Items</Typography>
        <Typography
          variant="subtitle2"
          style={{ display: "flex", alignItems: "center" }}
        >
          Hold <DragHandleSharpIcon fontSize="medium" /> to change order.
        </Typography>
      </Grid>
      <Divider />
      <Grid item container justifyContent="space-between" alignItems="center">
        <Grid item>Select UI Group </Grid>
        <Grid item>
          <ButtonGroup>
            {uiGroups.map((g) => (
              <Button
                variant={"contained"}
                color={g.id == selectedUiGroup ? `primary` : "secondary"}
                onClick={() => selectUiGroupId(g.id)}
                key={g.id}
              >
                {g.index}
              </Button>
            ))}
          </ButtonGroup>
        </Grid>
      </Grid>
      <Divider />
      <Grid item xs={12}>
        <Paper style={{ padding: 10 }}>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expandedItems}
            selected={uiItemsList
              ?.filter((i) => i?.ui_group_id == selectedUiGroup)
              ?.map((i) => i?.id?.toString())}
          >
            {loading ? <CircularProgress /> : renderTreeItems(uiItemsTree)}
          </TreeView>
        </Paper>
      </Grid>
    </Grid>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  treeItem: {},
  treeItemGroup: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}));

export default UIItemsTreeView;
