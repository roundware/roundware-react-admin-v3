/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState } from "react";
import { UiItemNode } from "types/uiGroups";
import {
  Box,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
} from "@material-ui/core";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import DragHandleSharpIcon from "@material-ui/icons/DragHandleSharp";
import DeleteIcon from "@material-ui/icons/Delete";
import { useBuildUI } from "providers/BuildUIContext";
import { Confirm, useNotify, useRefresh } from "react-admin";
import { useRoundwareDataProvider } from "providers/DataProviderContext";

interface Props {
  uiItem: UiItemNode;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

const TreeItemLabel = ({ uiItem, dragHandleProps }: Props): JSX.Element => {
  const i = uiItem;
  const { uiGroups, refetchData, dummyPatchForGroup } = useBuildUI();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useRoundwareDataProvider();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleOpenConfirm = () => setDeleteConfirm(true);
  const handleCloseConfirm = () => setDeleteConfirm(false);

  const handleOnConfirmDelete = async () => {
    setDeleting(true);
    try {
      await dataProvider.delete(`uiitems`, {
        id: uiItem.id,
        previousData: uiItem,
      });
      await dummyPatchForGroup(uiItem.ui_group_id);
      notify(`Deleted successfully!`, `success`);
      refetchData();
      refresh();
    } catch {
      notify(`Failed to delete!`, `error`);
    } finally {
      setDeleting(false);
      handleCloseConfirm();
    }
  };

  const [updating, setUpdating] = useState(false);
  const handleOnDefaultChange = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    try {
      setUpdating(true);
      await dataProvider.update(`uiitems`, {
        id: i.id,
        data: {
          default: checked,
        },
        previousData: i,
      });
      await dummyPatchForGroup(uiItem.ui_group_id);
      notify(`Updated successfully!`, `success`);
      refetchData();
      refresh();
    } catch {
      setUpdating(true);
      notify(`Failed to update!`, `error`);
    }
  };

  return (
    <Box sx={{}}>
      <Grid
        container
        direction="row"
        wrap="nowrap"
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid container>
          <Grid item {...dragHandleProps}>
            <DragHandleSharpIcon />
          </Grid>
          <Grid item>
            <Typography>
              (
              {uiGroups.findIndex((g) => g.id == i.ui_group_id) +
                1 +
                "." +
                i.index}
              ) {i.displayText}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          item
          container
          spacing={1}
          justifyContent="flex-end"
          alignItems="center"
        >
          {updating && (
            <Grid item>
              <CircularProgress size={16} />
            </Grid>
          )}
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  checked={i.default}
                  onChange={handleOnDefaultChange}
                  disabled={updating}
                />
              }
              label="Default"
            />
          </Grid>

          <Grid item>
            <IconButton onClick={handleOpenConfirm}>
              <DeleteIcon />
            </IconButton>
            {deleteConfirm && (
              <Confirm
                isOpen={true}
                title={`Delete Item: '${i.displayText}'`}
                content={
                  <div>
                    <div>
                      Are you sure you want to delete this item? This may delete
                      its child items also.
                    </div>
                    {deleting && <CircularProgress />}
                  </div>
                }
                confirm="Yes"
                confirmColor="primary"
                cancel="Cancel"
                onConfirm={handleOnConfirmDelete}
                onClose={handleCloseConfirm}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TreeItemLabel;
