/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useMemo } from "react";
import { UiItemNode } from "types/uiGroups";
import {
  Box,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogContent,
  LinearProgress,
} from "@material-ui/core";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import DragHandleSharpIcon from "@material-ui/icons/DragHandleSharp";
import DeleteIcon from "@material-ui/icons/Delete";
import CloseIcon from "@material-ui/icons/Close";
import { useBuildUI } from "providers/BuildUIContext";
import { Confirm, useNotify, useRefresh } from "react-admin";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import PlaylistAddIcon from "@material-ui/icons/PlaylistAdd";
import { ITag } from "types/tags";
interface Props {
  uiItem: UiItemNode;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

const TreeItemLabel = ({ uiItem, dragHandleProps }: Props): JSX.Element => {
  const i = uiItem;
  const { uiGroups, refetchData, dummyPatchForGroup, getTagsForGroup } =
    useBuildUI();
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

  const canNestItems = useMemo(() => {
    /** if its already of last ui group we can't nest items */
    const lastGroup = uiGroups[uiGroups.length - 1];
    if (uiItem.ui_group_id == lastGroup.id) return false;

    /** nothing matched return true */
    return true;
  }, [uiItem]);

  const [showNestingDialog, setShowNestingDialog] = useState(false);
  const handleCloseNestDialog = () => setShowNestingDialog(false);
  const [loadingTags, setLoadingTags] = useState(true);
  const [nestableTags, setNestableTags] = useState<ITag[]>([]);

  /** on nest button click */
  const handleOpenNestingDialog = async () => {
    /* show the dialog */
    setShowNestingDialog(true);
    /* show loading progress */
    setLoadingTags(true);

    /* get all the tags according to tag category of the group */
    const tags = await getTagsForGroup(i.ui_group_id);

    setLoadingTags(false);

    setNestableTags(tags);
  };

  const isTagNested = (tagId: number) =>
    i?.children?.some((item) => item.tag_id == tagId);

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
            <Tooltip title="Drag to Change Order">
              <DragHandleSharpIcon />
            </Tooltip>
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
          alignContent="center"
        >
          {canNestItems && (
            <Grid item>
              <Tooltip title="Nest Items">
                <IconButton onClick={handleOpenNestingDialog}>
                  <PlaylistAddIcon />
                </IconButton>
              </Tooltip>
              {showNestingDialog && (
                <Dialog open={showNestingDialog}>
                  <DialogContent>
                    <Grid container spacing={2} direction="column">
                      <Grid
                        item
                        container
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <Grid item>
                          <Typography>
                            Select Items To Nest below {i.displayText}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <IconButton onClick={handleCloseNestDialog}>
                            <CloseIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                      {loadingTags && (
                        <Grid item>
                          <LinearProgress />
                        </Grid>
                      )}
                      <Grid item container direction="column">
                        {nestableTags?.map((t) => (
                          <Grid item key={t.id}>
                            <FormControlLabel
                              control={<Checkbox checked={isTagNested(t.id)} />}
                              label={t.value}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </DialogContent>
                </Dialog>
              )}
            </Grid>
          )}
          {updating && (
            <Grid item>
              <CircularProgress size={16} />
            </Grid>
          )}

          <Grid item>
            <Tooltip title="Is Default Selected">
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
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="Delete Ui Item">
              <IconButton onClick={handleOpenConfirm}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
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
                    {deleting && <LinearProgress />}
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
