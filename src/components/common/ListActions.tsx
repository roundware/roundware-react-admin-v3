import React from "react";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  TopToolbar,
} from "react-admin";
import ImportButton from "./ImportButton";

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
    {/* Add your custom actions */}
    <ImportButton />
  </TopToolbar>
);

export default ListActions;
