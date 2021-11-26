/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "@material-ui/core";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import DragHandleSharpIcon from "@material-ui/icons/DragHandleSharp";
import TreeItem from "@material-ui/lab/TreeItem";
import TreeView from "@material-ui/lab/TreeView";
import { useBuildUI } from "providers/BuildUIContext";
import { UiItemNode } from "types/uiGroups";
import {
  Grid,
  Box,
  ButtonGroup,
  Button,
  Typography,
  Divider,
  Card,
  Paper,
} from "@material-ui/core";
import {
  Draggable,
  Droppable,
  DragDropContext,
  OnDragEndResponder,
  OnDragStartResponder,
} from "react-beautiful-dnd";
const UIItemsTreeView = (): JSX.Element => {
  const { uiItemsTree, loading, uiGroups, uiItemsList } = useBuildUI();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  const renderTreeItems = useCallback((items: UiItemNode[]) => {
    if (!items.length) return null;
    const droppableId =
      items?.[0]?.ui_group_id?.toString() +
      "-" +
      items?.[0]?.parent_id?.toString();
    return (
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={hanldeDragStart}>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => {
            return (
              <div ref={provided.innerRef} {...provided.droppableProps}>
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
                          label={
                            <Box>
                              <Grid container direction="row" wrap="nowrap">
                                <Grid item {...provided.dragHandleProps}>
                                  <DragHandleSharpIcon />
                                </Grid>
                                <Grid item>
                                  <Typography>
                                    (
                                    {uiGroups.findIndex(
                                      (g) => g.id == i.ui_group_id
                                    ) +
                                      1 +
                                      "." +
                                      i.index}
                                    ) {i.displayText}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
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
  }, []);

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
    console.log(provided);
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
        <Paper>
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

export default UIItemsTreeView;
