import { Chip, Stack } from "@mui/material";
import React from "react";

const SessionMapFilters = () => {
  return (
    <Stack>
      {[`location_update`, ``].map((t) => (
        <Chip key={t} />
      ))}
    </Stack>
  );
};

export default SessionMapFilters;
