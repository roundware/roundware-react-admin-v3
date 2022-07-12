import useFieldValue from "hooks/useFieldValue";
import React, { useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import { LoadingButton } from "@mui/lab";
import { useLocation } from "react-router-dom";
type Props = {
  source: string;
};

const FileDownloadButton = ({ source }: Props) => {
  const [file] = useFieldValue<string>(source);
  const [id] = useFieldValue<number>("id");
  const location = useLocation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  if (typeof file != "string") return null;
  return (
    <LoadingButton
      loading={downloadProgress > 0}
      startIcon={<DownloadIcon />}
      onClick={() => {
        const request = new XMLHttpRequest();

        request.responseType = "blob";
        request.onprogress = (ev) =>
          setDownloadProgress(ev.loaded / ev.total / 100);
        request.onload = (ev) => {
          try {
            const blob = request.response;

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement(`a`);
            a.href = downloadUrl;
            a.download =
              location.pathname.split(`/`).reverse()[1].slice(0, -1) +
              "_" +
              id +
              "_" +
              file.slice(file.lastIndexOf(`/`));
            document.body.appendChild(a);
            a.click();
          } catch (e) {
            console.error(e);
          } finally {
            setDownloadProgress(0);
          }
        };
        request.open(`GET`, file);
        request.send();
      }}
      variant="outlined"
      sx={{ my: 1 }}
    >
      {downloadProgress > 0
        ? `Downloading... ${downloadProgress.toFixed(2)}%`
        : `Download File`}
    </LoadingButton>
  );
};

export default FileDownloadButton;
