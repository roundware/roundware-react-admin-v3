import React from "react";
import {
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
} from "react-admin";
import { useCanEdit } from "../../hooks/useCanEdit";
import PreviewUi from "./PreviewUi";

const UIGroupListActions = (): JSX.Element => {
  const canEdit = useCanEdit();
  return (
    <TopToolbar>
      <FilterButton />
      {canEdit && <CreateButton />}
      <ExportButton />
      <PreviewUi />
    </TopToolbar>
  );
};

export default UIGroupListActions;
