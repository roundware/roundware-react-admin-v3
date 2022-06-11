import React from "react";
import { Stack } from "@mui/material";
import { Toolbar, useNotify, useRedirect, SaveButton } from "react-admin";
import { useFormContext } from "react-hook-form";
type Props = {};

const FormToolbar = (props: Props) => {
  const redirect = useRedirect();
  const notify = useNotify();
  const fc = useFormContext();
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
              fc.reset();
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
