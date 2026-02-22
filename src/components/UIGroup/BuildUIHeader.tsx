import React from "react";
import { Typography } from "@mui/material";

const BuildUIHeader = (): JSX.Element => {
  return (
    <>
      <Typography variant="h5">Build UI</Typography>
      <Typography variant="subtitle2">
        Select a UI Mode, add UI Groups to it, then use the Tree View to build
        the UI Item hierarchy. It helps to think of UI Groups as screens or
        prompts, with the UI Item tree representing available options depending
        on previous inputs of a group.
      </Typography>
    </>
  );
};

export default BuildUIHeader;
