import React from "react";
import {
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
} from "react-admin";
import PreviewUi from "./PreviewUi";

const UIGroupListActions = (): JSX.Element => {
  return (
    <TopToolbar>
      <FilterButton />
      <CreateButton />
      <ExportButton />
      <PreviewUi />
    </TopToolbar>
  );
};

export default UIGroupListActions;
