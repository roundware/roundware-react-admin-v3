import Delete from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
} from '@mui/material';
import React, { useState } from 'react';
import {
  useDelete,
  useDeleteMany,
  useListContext,
  useNotify,
  useRecordContext,
  useRefresh,
  useResourceContext,
} from 'react-admin';
import { useCanEdit } from '../../hooks/useCanEdit';

const DeleteWithBinary = ({ isBulk }: { isBulk?: boolean }) => {
  const canEdit = useCanEdit();
  const [openDialog, setOpenDialog] = useState(false);

  if (!canEdit) return null;

  const record = useRecordContext();

  const lc = useListContext();

  const resource = useResourceContext();
  const handleDeleteButton = () => {
    setOpenDialog(true);
  };

  const [deleteOne, { isLoading: isDeleteone }] = useDelete();

  // delete many
  const [deleteMany, { isLoading: isDeletingMany }] = useDeleteMany();

  // button loading state
  const isLoading = isBulk ? isDeletingMany : isDeleteone;

  // notification
  const notify = useNotify();

  // refresh
  const refresh = useRefresh();

  // delete function
  const handleConfirm = async () => {
    const delFunction = isBulk ? deleteMany : deleteOne;

    try {
      await delFunction(
        resource,
        {
          ...(isBulk ? { ids: lc?.selectedIds } : { id: record.id }),
          previousData: record,
          meta: {
            delete_binary: deleteBinary,
          },
        },
        {
          onError: (e) => {
            notify('Error deleting record ' + (e as Error)?.toString(), {
              type: 'error',
            });
            refresh();
          },

          onSuccess: () => {
            notify('Successfully deleted record', {
              type: 'success',
            });
            lc?.onUnselectItems?.();
            // refresh();
            setOpenDialog(false);
          },
        }
      );
    } catch (e) {
      notify('Error deleting record', {
        type: 'error',
      });
      refresh();
      return;
    }
  };

  const [deleteBinary, setDeleteBinary] = useState(false);
  return (
    <>
      <Button color='error' onClick={handleDeleteButton} sx={{ minWidth: 'auto', px: 1 }}>
        <Delete />
      </Button>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby={'delete-with-binary-option'}
      >
        <DialogTitle id={'delete-with-binary-option'}>Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this record?
          </DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                onChange={(e, c) => {
                  setDeleteBinary(c);
                }}
              />
            }
            label='Also delete file?'
          />

          {isBulk && (
            <Alert severity='warning'>
              This will delete all selected records and their files.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button color='error' onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>

          <LoadingButton
            loading={isLoading}
            onClick={handleConfirm}
            variant='contained'
            color='primary'
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteWithBinary;
