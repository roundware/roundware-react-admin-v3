import { Stack } from "@mui/material";
import React from "react";
import { SaveButton, Toolbar, useNotify, useRedirect } from "react-admin";
import { useFormContext } from "react-hook-form";

const FormToolbar = () => {
  const notify = useNotify();
  const fc = useFormContext();
  const redirect = useRedirect();

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
