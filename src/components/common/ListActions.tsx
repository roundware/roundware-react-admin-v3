import { Box, Stack, Typography } from "@mui/material";
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

/** A project with no contributions yet: add one, or bulk upload many (the
 *  stock empty page offered only Create). */
export const NoContributions = () => {
  const canEdit = useCanEdit();
  return (
    <Box sx={{ textAlign: "center", mt: 8, width: "100%" }}>
      <Typography variant="h5" color="text.secondary">
        No contributions yet
      </Typography>
      {canEdit && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They arrive as people take part. You can also add one here, or bulk upload many at once.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            <CreateButton variant="contained" />
            <ImportButton />
          </Stack>
        </>
      )}
    </Box>
  );
};

export default ListActions;
