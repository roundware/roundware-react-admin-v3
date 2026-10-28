import UploadIcon from "@mui/icons-material/Upload";
import { Button, Dialog } from "@mui/material";
import BulkUpload from "components/BulkUpload";
import React, { useState } from "react";
import { useRefresh } from "react-admin";

/** Contributions' "Bulk upload…" (server docs/032). */
const ImportButton = () => {
  const [open, setOpen] = useState(false);
  const refresh = useRefresh();
  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" startIcon={<UploadIcon />}>
        Bulk upload…
      </Button>
      {open && (
        <Dialog open fullScreen>
          <BulkUpload
            onClose={() => {
              setOpen(false);
              refresh();
            }}
          />
        </Dialog>
      )}
    </>
  );
};

export default ImportButton;
