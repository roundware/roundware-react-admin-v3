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
import { useRoundwareDataProvider } from 'context/DataProviderContext';
import React, { useContext, useState } from 'react';
import {
  Identifier,
  ListContext,
  useDelete,
  useDeleteMany,
  useNotify,
  useRecordContext,
  useRefresh,
  useResourceContext,
} from 'react-admin';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import { useCanEdit } from '../../hooks/useCanEdit';

/**
 * Delete one record, or the list's selected records, with a confirmation.
 *
 * For assets, it offers to delete their attachments too (roundware-server-v3
 * docs/014). Deleting never silently deletes anything else: the option is
 * shown only when there are attachments, starts unticked, and without it the
 * attachments are kept as ordinary assets.
 *
 * It used to offer "Also delete file?", which the server never read — asset
 * files were always deleted, speaker files never were — so it is gone rather
 * than left promising something it cannot do.
 */
const DeleteWithBinary = ({
  isBulk,
  onDeleted,
}: {
  isBulk?: boolean;
  /** Called after a successful delete — e.g. to leave an edit page. */
  onDeleted?: () => void;
}) => {
  // Every hook runs on every render; the early returns come after them.
  // (They used to follow `if (!canEdit) return null`, which breaks React's
  // rules of hooks whenever permissions change.)
  const canEdit = useCanEdit();
  const record = useRecordContext();
  // Read directly: useListContext() throws where there is no list, and this
  // is also used on the asset edit page, which has none.
  const lc = useContext(ListContext);
  const resource = useResourceContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const rw = useRoundwareDataProvider();
  const [deleteOne, { isLoading: isDeletingOne }] = useDelete();
  const [deleteMany, { isLoading: isDeletingMany }] = useDeleteMany();
  const [openDialog, setOpenDialog] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<Identifier[]>([]);
  const [includeAttachments, setIncludeAttachments] = useState(false);

  if (!canEdit || !record) return null;

  const isAssets = resource === 'assets';
  const ids: Identifier[] = isBulk ? lc?.selectedIds ?? [] : [record.id];
  const isLoading = isBulk ? isDeletingMany : isDeletingOne;

  const handleDeleteButton = async () => {
    setIncludeAttachments(false);
    setAttachmentIds([]);
    setOpenDialog(true);
    if (!isAssets) return;
    try {
      const lists = await Promise.all(
        ids.map((id) =>
          apiFetcher(`/assets/?parent_asset_id=${id}`).then(({ json }) =>
            Array.isArray(json) ? json : json?.results ?? []
          )
        )
      );
      // An attachment that is itself selected is being deleted anyway.
      setAttachmentIds(
        lists
          .flat()
          .map((a: { id: Identifier }) => a.id)
          .filter((id: Identifier) => !ids.includes(id))
      );
    } catch {
      // Counting is a courtesy; without it the delete still behaves safely.
    }
  };

  /** Keep the provider's cached list in step with what the server now holds. */
  const syncCache = () => {
    if (!isAssets || attachmentIds.length === 0) return;
    const cached = rw?.getResource('assets');
    if (!Array.isArray(cached)) return;
    rw.setResourse(
      'assets',
      includeAttachments
        ? cached.filter((a) => !attachmentIds.includes(a.id))
        : cached.map((a) =>
            attachmentIds.includes(a.id) ? { ...a, parent_asset_id: null } : a
          )
    );
  };

  const handleConfirm = async () => {
    const meta =
      isAssets && includeAttachments ? { include_attachments: true } : undefined;
    const options = {
      onError: (e: unknown) => {
        notify('Error deleting record ' + (e as Error)?.toString(), { type: 'error' });
        refresh();
      },
      onSuccess: () => {
        syncCache();
        notify('Successfully deleted', { type: 'success' });
        lc?.onUnselectItems?.();
        setOpenDialog(false);
        if (onDeleted) onDeleted();
        else refresh();
      },
    };
    try {
      if (isBulk) {
        await deleteMany(resource, { ids, meta }, options);
      } else {
        await deleteOne(resource, { id: record.id, previousData: record, meta }, options);
      }
    } catch {
      notify('Error deleting record', { type: 'error' });
      refresh();
    }
  };

  const n = attachmentIds.length;
  return (
    <>
      <Button color='error' onClick={handleDeleteButton} sx={{ minWidth: 'auto', px: 1 }}>
        <Delete />
      </Button>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby={'delete-dialog-title'}
      >
        <DialogTitle id={'delete-dialog-title'}>Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isBulk
              ? `Delete the ${ids.length} selected records?`
              : 'Are you sure you want to delete this record?'}
            {isAssets &&
              (isBulk
                ? ' Their audio and image files are deleted too.'
                : ' Its audio or image file is deleted too.')}
          </DialogContentText>

          {isAssets && n > 0 && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeAttachments}
                    onChange={(_e, c) => setIncludeAttachments(c)}
                  />
                }
                label={`Also delete ${n === 1 ? 'its attached asset' : `the ${n} attached assets`}`}
              />
              {!includeAttachments && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  {n === 1 ? 'The attachment is' : 'The attachments are'} kept, as
                  ordinary assets of their own.
                </Alert>
              )}
            </>
          )}

          {isBulk && !isAssets && (
            <Alert severity='warning' sx={{ mt: 1 }}>
              This will delete all selected records.
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
