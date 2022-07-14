/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useMemo } from "react";
import { UiItemNode, IUIItems } from "types/uiGroups";
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
  Button,
} from "@mui/material";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import DragHandleSharpIcon from "@mui/icons-material/DragHandleSharp";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useBuildUI } from "context/BuildUIContext";
import { Confirm, useNotify, useRefresh, useRedirect } from "react-admin";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
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
      const currentUiGroupItems = uiGroups.find(
        (g) => (g.id = uiItem.ui_group_id)
      )!.ui_items;

      if (uiItem.index < currentUiGroupItems.length) {
        // not last element
        // TODO: decrement index of previous items after current;

        // ui items having index greater than current
        const uiItemsToBeUpdated = currentUiGroupItems.filter(
          (i) => i.index > uiItem.index
        );

        // update with index - 1
        await Promise.all(
          uiItemsToBeUpdated.map((i) =>
            dataProvider.update(`uiitems`, {
              id: i.id,
              data: {
                index: i.index - 1,
              },
              previousData: i,
              meta: {},
            })
          )
        );
      }
      // last element delete with out issue
      await dataProvider.delete(`uiitems`, {
        id: uiItem.id,
        previousData: uiItem,
      });

      await dummyPatchForGroup(uiItem.ui_group_id);
      notify(`Deleted successfully!`, {
        type: "success",
      });
      await refetchData();
      await refresh();
    } catch {
      notify(`Failed to delete!`, {
        type: "error",
      });
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
      notify(`Updated successfully!`, {
        type: "success",
      });
      refetchData();
      refresh();
    } catch {
      setUpdating(true);
      notify(`Failed to update!`, {
        type: "error",
      });
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

  /** nested group */
  const nestedGroup = useMemo(
    () => uiGroups[uiGroups.findIndex((g) => g.id == i.ui_group_id) + 1],
    [uiItem]
  );

  /** on nest button click */
  const handleOpenNestingDialog = async () => {
    /* show the dialog */
    setShowNestingDialog(true);
    /* show loading progress */
    setLoadingTags(true);

    let tags: ITag[] = [];

    if (nestedGroup) {
      /* get all the tags according to tag category of the group */
      tags = await getTagsForGroup(nestedGroup.id);
    }

    setLoadingTags(false);

    setNestableTags(tags);
  };

  const isTagNested = (tagId: number) =>
    nestedGroup?.ui_items?.some(
      (item) => item.tag_id == tagId && item.parent_id == uiItem.id
    );

  const getNestedItemByTag = (tagId: number) =>
    nestedGroup?.ui_items?.find(
      (g) => g.tag_id == tagId && g.parent_id == uiItem.id
    );
  const handleOnTagChange = async (tagId: number, checked: boolean) => {
    try {
      setLoadingTags(true);
      /** if already nested then delete it */
      if (isTagNested(tagId) && !checked) {
        /** get the item to be deleted */
        const uiItemTobeDeleted = getNestedItemByTag(tagId);
        if (!uiItemTobeDeleted) throw new Error();
        /** send request to delete */
        await dataProvider.delete(`uiitems`, {
          id: uiItemTobeDeleted.id,
          previousData: uiItemTobeDeleted,
        });
      } else {
        /** construct the new ui Item */
        const newUiItem: Omit<IUIItems, `id`> = {
          parent_id: uiItem.id,
          tag_id: tagId,
          /** add to the last index (roundware index start from 1 so make sure to increment) */
          index:
            nestedGroup?.ui_items.filter((i) => i.parent_id === uiItem.id)
              .length + 1,
          active: true,
          /** user can default later */
          default: false,
          ui_group_id: nestedGroup.id,
        };

        /** save to db */
        await dataProvider.create(`uiitems`, {
          data: newUiItem,
        });
      }

      /** revalidate the nested group's cached data */
      await dummyPatchForGroup(nestedGroup.id);
      refetchData();
      refresh();
      notify(`Successfully nested item.`, {
        type: "success",
      });
    } catch {
      notify(`Sorry, something went wrong. Please try again.`, {
        type: "error",
      });
    } finally {
      setLoadingTags(false);
    }
  };

  const redirect = useRedirect();
  const handleRedirect = () => {
    redirect(`create`, `/tags`, undefined, {
      tag_category_id: nestedGroup.tag_category_id,
    });
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
                <IconButton onClick={handleOpenNestingDialog} size="large">
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
                            Select Tags To Nest below &ldquo;{i.displayText}
                            &rdquo;
                          </Typography>
                        </Grid>
                        <Grid item>
                          <IconButton
                            onClick={handleCloseNestDialog}
                            size="large"
                          >
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
                              disabled={loadingTags}
                              onChange={(_v, c) => handleOnTagChange(t.id, c)}
                            />
                          </Grid>
                        ))}

                        <Grid item>
                          <Button
                            variant="text"
                            onClick={handleRedirect}
                            style={{ textTransform: "none" }}
                            color="primary"
                          >
                            Create more Tags?
                          </Button>
                        </Grid>
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
              <IconButton onClick={handleOpenConfirm} size="large">
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
