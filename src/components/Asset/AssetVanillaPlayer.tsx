import React, { CSSProperties } from "react";
import { IAsset } from "types/asset";

interface AssetVainllaPlayerProps {
  asset: IAsset;
  style?: CSSProperties;
  className?: string;
  captureEvents?: boolean;
}

const AssetVainllaPlayer = ({
  asset,
  style,
  className,
}: AssetVainllaPlayerProps) => {
  if (!asset) {
    return null;
  }

  let ext = /(?:\.([^.]+))?$/.exec(asset.file! as string)![1];
  let filename = asset.file! as string;
  const supported = ["mp3", "wav"];
  if (supported.indexOf(ext) === -1) {
    ext = "mp3";
    let lastPos = filename.indexOf(".", filename.length - 5);
    let pos = lastPos == -1 ? filename.length : lastPos;
    filename = filename.substr(0, pos < 0 ? filename.length : pos) + "." + ext;
  }

  const audioType = `audio/${ext}`;

  return (
    <audio controls style={style} preload="none" className={className}>
      <source src={filename} type={audioType} />
      Your browser does not support audio!
    </audio>
  );
};

export default AssetVainllaPlayer;
