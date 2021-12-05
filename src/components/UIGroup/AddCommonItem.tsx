import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import { useBuildUI } from "providers/BuildUIContext";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useCallback, useMemo, useState } from "react";
import {
  DatagridRowProps,
  useNotify,
  useRedirect,
  useRefresh,
} from "react-admin";
import { ITag } from "types/tags";
import { IUIItems, UiItemNode } from "types/uiGroups";
const AddCommonItem = (props: DatagridRowProps): JSX.Element => {
  /**  selected group */
  const currentGroup = props.record;
  if (!currentGroup) return <></>;

  const { uiItemsList, uiGroups, tags, refetchData, dummyPatchForGroup } =
    useBuildUI();

  /** possible tags can be added for ui items of current group */
  const tagsToDisplay: ITag[] = React.useMemo(() => {
    /** filter them by tag_category of the group */
    const tempTagsToDisplay: ITag[] = tags?.filter(
      (t) =>
        t.tag_category_id && t.tag_category_id === props.record?.tag_category_id
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
  }, [tagsToDisplay, previousGroupItems, prevGroup]);

  const [showDialog, setShowDialog] = useState(false);
  const handleOpen = () => setShowDialog(true);
  const handleClose = () => setShowDialog(false);

  const [disabledItems, setDisabledItems] = useState<number[]>([]);

  const setLoadingOn = (tagId: ITag[`id`]) =>
    setDisabledItems((prev) => [...prev, tagId]);
  const setLoadingOff = (tagId: ITag[`id`]) =>
    setDisabledItems((prev) => prev?.filter((i) => i !== tagId));

  const notify = useNotify();
  const refresh = useRefresh();

  const dataProvider = useRoundwareDataProvider();
  const handleOnChange = async (t: ITag, checked: boolean) => {
    try {
      setLoadingOn(t.id);
      console.log(t, checked);

      if (checked) {
        const itemsToBeCreated: Omit<IUIItems, "id">[] = [];

        /** for fist level */
        if (currentGroup.index === 1) {
          if (!currentGroupItems?.some((cgi) => cgi.tag_id == t.id)) {
            itemsToBeCreated.push({
              active: true,
              default: false,
              parent_id: null,
              tag_id: t.id,
              index: currentGroupItems?.length + 1,
              ui_group_id: Number(currentGroup.id),
            });
          }
        } else {
          /** need nest below all the items from parent element */
          previousGroupItems?.forEach((i) => {
            /** only if item with that tag id doesn't exists */
            if (
              !currentGroupItems?.some(
                (cgi) => cgi.parent_id == i.id && cgi.tag_id == t.id
              )
            ) {
              /** calculate new index */
              const index = currentGroupItems?.reduce<number>((acc, crr) => {
                if (crr.parent_id == i.id) return acc + 1;
                return acc;
              }, 1);

              /** add to items to be created list */
              itemsToBeCreated.push({
                active: true,
                default: false,
                parent_id: i.id,
                tag_id: t.id,
                index,
                ui_group_id: Number(currentGroup.id),
              });
            }
          });
        }

        const promises = itemsToBeCreated?.map((i) =>
          dataProvider.create(`uiitems`, {
            data: i,
          })
        );
        /**resolve all create requests */
        await Promise.all(promises);
      } else {
        console.log(`delete`);
        /** need to delete on unselect */
        const itemsIdsToBeDeleted = currentGroupItems?.reduce<number[]>(
          (acc, crr) => {
            if (crr.tag_id == t.id) {
              acc.push(crr.id);
            }
            return acc;
          },
          []
        );

        /** delete req promises */
        const promises = itemsIdsToBeDeleted.map((i) =>
          dataProvider.delete(`uiitems`, {
            id: i,
          })
        );

        /** resolve al promises */
        await Promise.all(promises);
      }
      /** get the latest ui items in the group object */
      await dummyPatchForGroup(Number(currentGroup.id));
      /** refresh the data */
      refresh();
      refetchData();
      /** notify user! */
      notify(`Request complete for "${t?.value}" 👍`, {
        type: "success",
      });
    } catch {
      notify(`Something went wrong. Sorry`, {
        type: "error",
      });
    } finally {
      setLoadingOff(t.id);
    }
  };

  const redirect = useRedirect();
  const handleAddMore = () =>
    redirect(
      `create`,
      `/tags?filter=${JSON.stringify({
        tag_category_id: props?.record?.tag_category_id,
      })}`
    );

  return (
    <>
      <Tooltip title="Add Common item at all levels">
        <IconButton size="small" onClick={handleOpen}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={showDialog}>
        <DialogContent>
          <Grid container direction="column" spacing={2}>
            <Grid item container spacing={4} wrap="nowrap" alignItems="center">
              <Grid item>
                <Typography variant="h6">Add Common Item</Typography>
                <Typography variant="caption">
                  Checking will add the item to all possible nested levels.{" "}
                  <br />
                  <b>Note:</b>
                  Unselecting an item will also remove it from all the levels.
                </Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={handleClose}>
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
                        checked={checkboxValues[index]}
                        onChange={(_e, checked) => handleOnChange(i, checked)}
                      />
                    }
                    disabled={disabledItems?.includes(i?.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={handleAddMore}>
            Add more Tags?
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddCommonItem;
