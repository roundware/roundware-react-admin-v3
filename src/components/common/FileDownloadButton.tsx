import { Button } from "@mui/material";
import useFieldValue from "hooks/useFieldValue";
import React from "react";
import DownloadIcon from "@mui/icons-material/Download";
type Props = {
  source: string;
};

const FileDownloadButton = ({ source }: Props) => {
  const [file] = useFieldValue<string>(source);
  const [id] = useFieldValue<number>("id");
  if (typeof file != "string") return null;
  return (
    <Button
      startIcon={<DownloadIcon />}
      onClick={() => {
        const link = document.createElement("a");
        link.download = id + "_" + file.substring(file.lastIndexOf("/") + 1);
        link.href = file;
        // link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }}
      variant="outlined"
      sx={{ my: 1 }}
    >
      Download File
    </Button>
  );
};

export default FileDownloadButton;
