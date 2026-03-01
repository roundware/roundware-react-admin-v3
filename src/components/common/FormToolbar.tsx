import { Stack, Typography } from "@mui/material";
import React from "react";
import { SaveButton, Toolbar, useNotify, useRedirect } from "react-admin";
import { useFormContext } from "react-hook-form";
import { useCanEdit } from "../../hooks/useCanEdit";

const FormToolbar = () => {
  const notify = useNotify();
  const fc = useFormContext();
  const redirect = useRedirect();
  const canEdit = useCanEdit();

  if (!canEdit) {
    return (
      <Toolbar>
        <Typography variant="body2" color="text.secondary">
          Read-only — you do not have permission to edit.
        </Typography>
      </Toolbar>
    );
  }

  return (
    <Toolbar>
      <Stack direction="row" spacing={1}>
        <SaveButton label="Save" />
        <SaveButton
          label="Save + New"
          mutationOptions={{
            onSuccess: () => {
              notify(`Successfully saved!`);
              redirect(false);
              fc.reset({});
              window.scrollTo(0, 0);
            },
          }}
          type="button"
          variant="text"
        />
      </Stack>
    </Toolbar>
  );
};

export default FormToolbar;
