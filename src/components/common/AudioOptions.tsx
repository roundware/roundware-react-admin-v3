import { CardContent, Grid, TextField, Theme, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import Card from "@mui/material/Card";
import React, { useEffect } from "react";
import useFieldValue from "../../hooks/useFieldValue";
import CustomSlider from "./CustomSlider";
import { FileEdit } from "./FileEdit";
import VolumeSlider from "./VolumeSlider";
import LineWeightIcon from "@mui/icons-material/LineWeight";

const AudioOptions = (): JSX.Element => {
  const [mediaType] = useFieldValue(`media_type`);
  const [startTime, setStartTime] = useFieldValue(`start_time`);
  const [endTime, setEndTime] = useFieldValue(`end_time`);
  const [file] = useFieldValue(`file`);
  const [, setVolume] = useFieldValue(`volume`);
  const [durationInSec] = useFieldValue(`audio_length_in_seconds`);
  const styles = useStyles();

  useEffect(() => {
    if (typeof file !== "string") setVolume(1);
  }, [file]);

  if (mediaType !== "audio") return <FileEdit />;
  return (
    <Card variant="outlined" style={{ marginBottom: 28 }}>
      <CardContent>
        <Typography variant="h6">Audio</Typography>
        <Grid container spacing={3}>
          <Grid item container md={9} xs={6}>
            <Grid item xs={12}>
              <FileEdit />
            </Grid>
            <Grid item container className={styles.timesContainer}>
              <Grid item xs={6}>
                <TextField
                  value={startTime || 0}
                  onChange={setStartTime}
                  variant="filled"
                  label="Start"
                  fullWidth
                  InputProps={{ className: styles.inputLeft }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  value={endTime || 0}
                  onChange={setEndTime}
                  variant="filled"
                  label="End"
                  fullWidth
                  InputProps={{ className: styles.inputRight }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  value={durationInSec || 0}
                  variant="filled"
                  label="Audio Length"
                  fullWidth
                  InputProps={{ className: styles.inputBottom }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid
            xs={12}
            md={3}
            container
            item
            direction="row"
            spacing={3}
            justifyContent="space-around"
          >
            <Grid item>
              <VolumeSlider />
            </Grid>
            <Grid item>
              <CustomSlider
                vertical
                icon={<LineWeightIcon />}
                field={`weight`}
                label="Weight"
                defaultValue={50}
              />
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AudioOptions;

const useStyles = makeStyles((theme: Theme) => ({
  inputLeft: {
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borde: "none",
  },
  inputRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    border: "none",
  },
  inputBottom: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  timesContainer: {
    width: 360,
    borderRadius: theme.shape.borderRadius,
    border: "1px solid",
    borderColor: "rgba(0, 0, 0, 0.47)",
    borderBottomWidth: 0,
  },
  labelStyle: {
    fontSize: 16,
  },
}));
