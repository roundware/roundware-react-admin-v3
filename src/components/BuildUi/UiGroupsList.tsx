import React from "react";
import { Card, CardContent, CardHeader, Grid } from "@material-ui/core";
import { useBuildUI } from "providers/BuildUIContext";

const UiGroupsList = (): JSX.Element => {
  const { uiGroups } = useBuildUI();
  return (
    <Grid container direction="column" spacing={1}>
      {uiGroups?.map((g) => (
        <Grid key={g.id} item xs={12}>
          <Card>
            <CardHeader title={g.index + ". " + g.header_text_loc} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default UiGroupsList;
