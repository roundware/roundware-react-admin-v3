import React from "react";
import { Card, CardContent, Grid, Typography } from "@material-ui/core";
import CustomSlider from "components/common/CustomSlider";
interface Props {}

const SpeakerAudioControls = (props: Props) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container direction="row">
          <Grid item></Grid>
          <Grid
            item
            container
            direction="row"
            spacing={2}
            justifyContent="space-around"
          >
            <Grid item>
              <CustomSlider
                defaultValue={10}
                label="Min Volume"
                field="minvolume"
              />
            </Grid>
            <Grid item>
              <CustomSlider
                defaultValue={50}
                label="Max Volume"
                field="maxvolume"
              />
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SpeakerAudioControls;
