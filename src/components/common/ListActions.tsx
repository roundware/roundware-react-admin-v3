import React from "react";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  TopToolbar,
} from "react-admin";
import { useCanEdit } from "../../hooks/useCanEdit";
import ImportButton from "./ImportButton";

const ListActions = () => {
  const canEdit = useCanEdit();
  return (
    <TopToolbar>
      <FilterButton />
      {canEdit && <CreateButton />}
      <ExportButton />
      {canEdit && <ImportButton />}
    </TopToolbar>
  );
};

export default ListActions;
