import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { NumberInput, useRecordContext } from 'react-admin';
import { Link } from 'react-router-dom';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';

/**
 * Which contribution this asset belongs to, or what is attached to it
 * (roundware-server-v3 docs/014).
 *
 * A bundle is one main asset and its attachments, one level deep. The field
 * sets `parent_asset_id`: a number attaches this asset to that one (joining
 * its main asset if it is itself an attachment); empty detaches it. An asset
 * with attachments of its own cannot be attached elsewhere — the server
 * refuses, since that would make a second level — so the field is disabled
 * and says why.
 */
const AssetBundleField = () => {
  const record = useRecordContext();
  const [attachments, setAttachments] = useState<
    { id: number; media_type: string }[] | null
  >(null);

  useEffect(() => {
    if (record?.id == null) return;
    let cancelled = false;
    apiFetcher(`/assets/?parent_asset_id=${record.id}`)
      .then(({ json }) => {
        if (!cancelled) setAttachments(Array.isArray(json) ? json : json?.results ?? []);
      })
      .catch(() => !cancelled && setAttachments([]));
    return () => {
      cancelled = true;
    };
  }, [record?.id]);

  if (!record) return null;
  const hasAttachments = (attachments?.length ?? 0) > 0;

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Typography variant='subtitle2' gutterBottom>
        Bundle
      </Typography>

      {record.parent_asset_id != null && (
        <Typography variant='body2' sx={{ mb: 1 }}>
          Attached to{' '}
          <Link to={`/assets/${record.parent_asset_id}`}>asset #{record.parent_asset_id}</Link>
          , the main asset of its contribution.
        </Typography>
      )}

      {hasAttachments && (
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
          <Typography variant='body2'>Attached to this asset:</Typography>
          {attachments!.map((a) => (
            <Chip
              key={a.id}
              size='small'
              component={Link}
              to={`/assets/${a.id}`}
              clickable
              label={`#${a.id} · ${a.media_type}`}
            />
          ))}
        </Stack>
      )}

      <NumberInput
        source='parent_asset_id'
        label='Attached to asset #'
        fullWidth
        disabled={hasAttachments}
        helperText={
          hasAttachments
            ? 'This asset has attachments of its own, so it cannot be attached to another. Detach them first.'
            : 'Enter an asset ID to add this to its contribution. Leave empty for a main asset of its own.'
        }
      />

      {record.parent_asset_id == null && !hasAttachments && attachments !== null && (
        <Alert severity='info' variant='outlined' sx={{ mt: 1 }}>
          A contribution on its own — nothing is attached to it.
        </Alert>
      )}
    </Box>
  );
};

export default AssetBundleField;
