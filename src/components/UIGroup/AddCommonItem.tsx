import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { differenceBy, groupBy, isEqual } from "lodash";
import { useBuildUI } from "providers/BuildUIContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useCallback, useMemo, useState } from "react";
import {
  CreateResult,
  DeleteResult,
  RaRecord,
  UpdateResult,
  useNotify,
  useRedirect,
  useRefresh,
} from "react-admin";
import { ITag } from "types/tags";
import { IUIGroup, IUIItems, UiItemNode } from "types/uiGroups";
const AddCommonItem = ({ group }: { group: IUIGroup }): JSX.Element => {
  const currentGroup = group;
  /**  selected group */
  if (!currentGroup) return <></>;

  const { uiItemsList, uiGroups, tags, refetchData, dummyPatchForGroup } =
    useBuildUI();

  /** possible tags can be added for ui items of current group */
  const tagsToDisplay: ITag[] = React.useMemo(() => {
    /** filter them by tag_category of the group */
    const tempTagsToDisplay: ITag[] = tags?.filter(
      (t) =>
        t.tag_category_id && t.tag_category_id === currentGroup?.tag_category_id
    );

    return tempTagsToDisplay;
  }, [uiItemsList]);

  /** previos group (comes one level before current) */
  const prevGroup = useMemo(
    () => uiGroups[uiGroups?.findIndex((g) => g.id == currentGroup.id) - 1],
    [uiGroups]
  );

  /** ui items of current group */
  const currentGroupItems: UiItemNode[] = useMemo(
    () => uiItemsList?.filter((i) => i.ui_group_id == currentGroup.id),
    [uiItemsList]
  );

  /** ui items of previous group (that is one level above current) */
  const previousGroupItems: UiItemNode[] = useMemo(() => {
    /** might be already first */
    if (!prevGroup) return [];

    /** return its ui items */
    return uiItemsList?.filter((i) => i?.ui_group_id == prevGroup?.id);
  }, [uiItemsList]);

  /** count of items containing that tag */
  const getTagCount = useCallback(
    (tag: ITag) => {
      return uiItemsList?.filter((i) => i.tag_id == tag.id)?.length;
    },
    [uiItemsList]
  );

  const checkboxValues = useMemo(() => {
    return tagsToDisplay?.reduce<boolean[]>((acc, cur) => {
      if (getTagCount(cur) / (prevGroup ? previousGroupItems?.length : 1) === 1)
        acc.push(true);
      else acc.push(false);
      return acc;
    }, []);
  }, [tagsToDisplay, previousGroupItems, prevGroup, getTagCount]);

  const [showDialog, setShowDialog] = useState(false);
  const handleOpen = () => setShowDialog(true);
  const handleClose = () => setShowDialog(false);

  const notify = useNotify();
  const refresh = useRefresh();

  const dataProvider = useRoundwareDataProvider();

  const redirect = useRedirect();
  const handleAddMore = () =>
    redirect(
      `create`,
      `/tags?filter=${JSON.stringify({
        tag_category_id: `%d${currentGroup?.tag_category_id}`,
      })}`
    );

  const alreadyCommonTags = useMemo(() => {
    return tagsToDisplay?.filter((t, i) => checkboxValues[i]) || [];
  }, [tagsToDisplay, checkboxValues]);

  const [dirtyList, setDirtyList] = useState<ITag[]>(alreadyCommonTags);
  const addItem = (t: ITag) => setDirtyList((prev) => [...prev, t]);
  const removeItem = (t: ITag) =>
    setDirtyList((prev) => [...prev].filter((i) => i.id != t.id));

  const saveDisable = useMemo(
    () =>
      isEqual(
        alreadyCommonTags.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1)),
        dirtyList.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1))
      ),
    [alreadyCommonTags, dirtyList, currentGroupItems]
  );

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    let newUiItemsList: IUIItems[] = currentGroupItems;

    const tagsToBeCreated = differenceBy(dirtyList, alreadyCommonTags, "id");

    tagsToBeCreated.forEach((t) => {
      if (currentGroup.index == 1) {
        const lastIndex = Math.max(...newUiItemsList.map((i) => i.index));

        newUiItemsList.push({
          id: undefined!,
          tag_id: t.id,
          active: true,
          default: false,
          index: lastIndex + 1,
          ui_group_id: currentGroup.id,
          parent_id: null,
        });
      } else {
        previousGroupItems.forEach((pgi) => {
          const lastIndex = Math.max(
            ...newUiItemsList
              .filter((i) => i.parent_id == pgi.id)
              .map((i) => i.index)
          );

          newUiItemsList.push({
            id: undefined!,
            tag_id: t.id,
            active: true,
            default: false,
            index: lastIndex + 1,
            ui_group_id: currentGroup.id,
            parent_id: pgi.id,
          });
        });
      }
    });

    const tagsToBeDeleted = differenceBy(
      Object.keys(groupBy(currentGroupItems, "tag_id"))
        .map((t) => tagsToDisplay.find((dt) => dt.id == Number(t))!)
        .filter((t) => !!t),
      dirtyList,
      "id"
    );

    newUiItemsList = newUiItemsList.filter(
      (i) => !tagsToBeDeleted.some((t) => t.id == i.tag_id)
    );

    // indexes in sorted order;
    const groupedItems = groupBy(newUiItemsList, "parent_id");

    const promises: (
      | Promise<CreateResult<RaRecord>>
      | Promise<UpdateResult<RaRecord>>
      | Promise<DeleteResult<RaRecord>>
    )[] = [];

    Object.values(groupedItems).forEach((g) => {
      const sortedIndexWise = g.sort((a, b) => (a.index > b.index ? 1 : -1));
      sortedIndexWise.forEach((i, index) => {
        const expectedIndex = index + 1;

        if (!i.id) {
          promises.push(
            dataProvider.create(`uiitems`, {
              data: {
                ...i,
                index: expectedIndex,
              },
            })
          );
        } else if (i.index != expectedIndex) {
          promises.push(
            dataProvider.update(`uiitems`, {
              id: i.id,
              data: {
                ...i,
                index: expectedIndex,
              },
              previousData: i,
            })
          );
        }
      });
    });

    currentGroupItems.forEach((i) => {
      if (tagsToBeDeleted.some((t) => t.id == i.tag_id)) {
        promises.push(
          dataProvider.delete(`uiitems`, {
            id: i.id,
          })
        );
      }
    });

    await Promise.all(promises);
    /** get the latest ui items in the group object */
    await dummyPatchForGroup(Number(currentGroup.id));
    /** refresh the data */
    await refetchData();
    await refresh();
    /** notify user! */

    notify(`Saved changes successfully`, {
      type: "success",
    });
    setLoading(false);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Add Common item at all levels">
        <IconButton size="small" onClick={handleOpen}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Dialog keepMounted={false} open={showDialog}>
        <DialogContent>
          <Grid container direction="column" spacing={2}>
            <Grid item container spacing={4} wrap="nowrap" alignItems="center">
              <Grid item>
                <Typography variant="h6">
                  Common Items For All Levels
                </Typography>
              </Grid>

              <Grid item>
                <IconButton onClick={handleClose} size="large">
                  <CloseIcon />
                </IconButton>
              </Grid>
            </Grid>

            <Grid item container direction="column">
              {tagsToDisplay?.map((i, index) => (
                <Grid item key={i.id}>
                  <FormControlLabel
                    label={`${i?.value} (${getTagCount(i)}/${
                      prevGroup ? previousGroupItems?.length : 1
                    })`}
                    control={
                      <Checkbox
                        checked={dirtyList.some((t) => t.id == i.id)}
                        onChange={(_e, checked) =>
                          checked ? addItem(i) : removeItem(i)
                        }
                      />
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={handleAddMore}>
            Create more Tags in this category?
          </Button>
          <LoadingButton
            loading={loading}
            variant="contained"
            disabled={saveDisable}
            onClick={handleSave}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddCommonItem;
