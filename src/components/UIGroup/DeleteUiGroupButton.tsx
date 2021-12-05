/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useBuildUI } from "providers/BuildUIContext";
import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  LinearProgress,
  makeStyles,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  Record,
  DeleteButtonProps,
  useRefresh,
  UpdateResult,
  DeleteResult,
  useNotify,
} from "react-admin";
import { useRoundwareDataProvider } from "providers/DataProviderContext";

const DeleteUiGroupButton = ({ record }: DeleteButtonProps): JSX.Element => {
  const { refetchData, uiGroups, uiItemsList } = useBuildUI();
  const [showConfirm, setShowConfirm] = useState(false);
  const handleClose = () => setShowConfirm(false);
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);
  const refreshData = () => {
    refetchData();
    refresh();
  };
  const dataProvider = useRoundwareDataProvider();
  const notify = useNotify();
  const handleDelete = async () => {
    try {
      setLoading(true);
      const promises: Promise<UpdateResult<Record> | DeleteResult<Record>>[] =
        [];
      uiGroups.forEach((g) => {
        if (g.index > record!.index) {
          const updateProm = dataProvider.update(`uigroups`, {
            id: g.id,
            data: {
              index: g.index - 1,
            },
            previousData: g,
          });
          promises.push(updateProm);
        }
      });

      uiItemsList.forEach((i) => {
        if (i.ui_group_id == record?.id) {
          const deleteProm = dataProvider.delete(`uiitems`, {
            id: i.id,
          });
          promises.push(deleteProm);
        }
      });

      const deleteProm = dataProvider.delete(`uigroups`, {
        id: record!.id,
      });
      await Promise.all([...promises, deleteProm]);
      notify(`Successfully deleted!`, {
        type: "success",
      });
    } catch (e) {
      notify(`Something went wrong. Sorry.`, {
        type: "error",
      });
    } finally {
      refreshData();
      setLoading(false);
    }
  };
  const classes = useStyles();
  return (
    <>
      <IconButton
        size="small"
        className={classes.root}
        onClick={() => setShowConfirm(true)}
      >
        <DeleteIcon />
      </IconButton>
      <Dialog onClose={handleClose} open={showConfirm}>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this Group? This will also delete
            its UI items and including the ones nested below it.
          </Typography>
          {loading && <LinearProgress />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.error.main,
  },
}));
export default DeleteUiGroupButton;
