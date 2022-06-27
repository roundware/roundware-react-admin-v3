/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useBuildUI } from "context/BuildUIContext";
import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  LinearProgress,
  Theme,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  RaRecord,
  DeleteButtonProps,
  useRefresh,
  UpdateResult,
  DeleteResult,
  useNotify,
  useRecordContext,
} from "react-admin";
import { useRoundwareDataProvider } from "context/DataProviderContext";

const DeleteUiGroupButton = (): JSX.Element => {
  const record = useRecordContext();
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
      const promises: Promise<
        UpdateResult<RaRecord> | DeleteResult<RaRecord>
      >[] = [];
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
            previousData: i as RaRecord,
          });
          promises.push(deleteProm);
        }
      });

      const deleteProm = dataProvider.delete(`uigroups`, {
        id: record!.id,
        previousData: record as RaRecord,
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
          <Button variant="contained" color="secondary" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    color: theme.palette.error.main,
  },
}));
export default DeleteUiGroupButton;
