import Download from '@mui/icons-material/Download';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import React, { useState } from 'react';
import { useRecordContext } from 'react-admin';
import { useQuery } from 'react-query';
const TextDisplayField = () => {
  const [open, Open] = useState(false);
  const record = useRecordContext();
  return (
    <>
      <Button
        size='small'
        onClick={() => {
          Open(true);
        }}
      >
        Dipslay Text Content
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          Open(false);
        }}
      >
        <DialogTitle>Text Content</DialogTitle>
        <DialogContent>
          {open && <TextDisplay file={record?.file} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const TextDisplay = ({ file }: { file?: string }) => {
  const textContentQuery = useQuery(
    [`text`, file],
    () => fetch(file ?? ``).then((res) => res.text()),
    {
      enabled: !!file,
    }
  );
  return (
    <div>
      {textContentQuery.isLoading ? (
        <CircularProgress />
      ) : textContentQuery.data ? (
        <Stack spacing={2}>
          <pre>{textContentQuery.data}</pre>
          <Box>
            <Button startIcon={<Download />} href={file} component='a' download>
              Download
            </Button>
          </Box>
        </Stack>
      ) : null}
    </div>
  );
};

export default TextDisplayField;
