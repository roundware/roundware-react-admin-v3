import GetAppIcon from "@mui/icons-material/GetApp";
import IconButton from "@mui/material/IconButton";
import { useProjects } from "context/ProjectsContext";
import React from "react";
import { IAsset } from "types/asset";

const downloadAsset = async (asset: IAsset, projectName: string) => {
  if (!asset.file) return;
  const exts = /(?:\.([^.]+))?$/.exec(asset.file as string);
  // no extension found
  if (!Array.isArray(exts)) return;
  let ext = exts[1];
  let filename = asset.file as string;
  const supported = ["mp3", "wav", "mp4", "m4a"];
  if (supported.indexOf(ext) === -1) {
    ext = "mp3";
    filename = `${filename}.${ext}`;
  }
  const response = await fetch(filename, {
    headers: new Headers({
      Origin: location.origin,
    }),
    mode: "cors",
  });
  const blob = await response.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = `${projectName}_${asset.id}`;
  a.href = blobUrl;
  // For Firefox https://stackoverflow.com/a/32226068
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const AssetActionButtons = ({ asset }: { asset: IAsset }) => {
  const { selectedProject } = useProjects();
  const projectName = selectedProject!.name;

  return (
    <div id="infoVoteBlock">
      <IconButton
        onClick={() => downloadAsset(asset, projectName)}
        style={{ minWidth: 30 }}
        title="download this audio file"
      >
        <GetAppIcon />
      </IconButton>
    </div>
  );
};
