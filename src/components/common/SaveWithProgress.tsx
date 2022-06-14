import { LoadingButton } from "@mui/lab";
import { useProgress } from "providers/ProgressContext";
import React from "react";

type Props = {};

const SaveWithProgress = (props: Props) => {
  const {} = useProgress();
  return <LoadingButton>Save</LoadingButton>;
};

export default SaveWithProgress;
