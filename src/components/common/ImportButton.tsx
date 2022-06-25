import CloseIcon from "@mui/icons-material/Close";
import FullScreenIcon from "@mui/icons-material/Fullscreen";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Button,
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import useBoolean from "hooks/useBoolean";
import React, { useState } from "react";
import ImportView from "./ImportView";

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
          <ImportView handleClose={() => setOpen(false)} />
        </Dialog>
      )}
    </>
  );
};

export default ImportButton;
