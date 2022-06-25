import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import FullScreenIcon from "@mui/icons-material/Fullscreen";
import { ListContextProvider, TextField, Datagrid } from "react-admin";
import ImportView from "./ImportView";
import useBoolean from "hooks/useBoolean";

const ImportButton = () => {
  const [open, setOpen] = useState(false);
  const fullScreen = useBoolean(true);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="small"
        startIcon={<UploadIcon />}
      >
        Import
      </Button>
      {open && (
        <Dialog open={open} fullScreen={fullScreen.value}>
          <DialogTitle>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <span>Import</span>
              <Stack direction="row" spacing={1}>
                <IconButton title="Full Screen" onClick={fullScreen.toggle}>
                  <FullScreenIcon />
                </IconButton>
                <IconButton title="Close" onClick={() => setOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Stack>
          </DialogTitle>
          <Divider />
          <ImportView />
        </Dialog>
      )}
    </>
  );
};

export default ImportButton;
