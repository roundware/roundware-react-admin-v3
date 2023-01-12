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
import Article from '@mui/icons-material/Article';
import { LoadingButton } from '@mui/lab';
import { saveAs } from 'file-saver';
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
        startIcon={<Article />}
      >
        Dipslay Text
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

  const handleDownload = async () => {
    if (!file) return;

    // download the file and save as
    const res = await fetch(file);
    const blob = await res.blob();
    saveAs(blob, file.split('/').pop() ?? 'file.txt');
  };

  return (
    <div>
      {textContentQuery.isLoading ? (
        <CircularProgress />
      ) : textContentQuery.data ? (
        <Stack spacing={2}>
          <pre>{textContentQuery.data}</pre>
          <Box>
            <LoadingButton startIcon={<Download />} onClick={handleDownload}>
              Download
            </LoadingButton>
          </Box>
        </Stack>
      ) : null}
    </div>
  );
};

export default TextDisplayField;
