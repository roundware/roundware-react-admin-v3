import React, { useState, useEffect } from "react";
import {
  Grid,
  Tooltip,
  IconButton,
  Dialog,
  DialogContent,
  Typography,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from "@material-ui/core";
import { DatagridRowProps, useRedirect } from "react-admin";
import { useBuildUI } from "providers/BuildUIContext";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import { UiItemNode } from "types/uiGroups";
import { ITag } from "types/tags";
const AddCommonItem = (props: DatagridRowProps): JSX.Element => {
  const { uiItemsList, uiGroups, tags } = useBuildUI();
  const tagsToDisplay: ITag[] = React.useMemo(() => {
    console.log(tags);
    let tempTagsToDisplay: ITag[] = tags?.filter(
      (t) =>
        t.tag_category_id && t.tag_category_id === props.record?.tag_category_id
    );
    console.log(props.record);
    const itemsForCurrentGroup =
      uiItemsList?.filter((i) => i?.ui_group_id == props.record?.id) || [];

    tempTagsToDisplay = tempTagsToDisplay?.filter(
      (t) => !itemsForCurrentGroup.some((i) => i.tag_id == t.id)
    );

    return tempTagsToDisplay;
  }, [uiItemsList]);
  const [showDialog, setShowDialog] = useState(false);
  const handleOpen = () => setShowDialog(true);
  const handleClose = () => setShowDialog(false);

  const handleOnChange = (t: ITag) => {
    console.log(t);
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
              </Grid>
              <Grid item>
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Grid>
            </Grid>
            <Grid item container direction="column">
              {tagsToDisplay?.map((i) => (
                <Grid item key={i.id}>
                  <FormControlLabel
                    label={i?.value}
                    control={<Checkbox />}
                    onChange={() => handleOnChange(i)}
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
