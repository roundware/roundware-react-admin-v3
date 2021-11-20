import { Box, Divider, Grid } from "@material-ui/core";
import { BuildUIContextProvider } from "providers/BuildUIContext";
import React from "react";
import BuildUIHeader from "./BuildUIHeader";
import PreviewUi from "./PreviewUi";
import UiGroupsList from "./UiGroupsList";
import UiModeSelector from "./UiModeSelector";
const BuildUiPage = (): JSX.Element => {
  return (
    <BuildUIContextProvider>
      <Box pt={5}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <BuildUIHeader />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid
            item
            container
            xs={12}
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Grid item>
              <UiModeSelector />
            </Grid>
            <Grid item>
              <PreviewUi />
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} md={6}>
            <UiGroupsList />
          </Grid>
        </Grid>
      </Box>
    </BuildUIContextProvider>
  );
};

export default BuildUiPage;
