import LineWeightIcon from "@mui/icons-material/LineWeight";
import {
    CardContent,
    Grid,
    Stack,
    TextField,
    Theme,
    Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import makeStyles from "@mui/styles/makeStyles";
import { useEffect } from "react";
import useFieldValue from "../../hooks/useFieldValue";
import CustomSlider from "./CustomSlider";
import { FileEdit } from "./FileEdit";
import VolumeSlider from "./VolumeSlider";

const AudioOptions = (): JSX.Element => {
  const [mediaType] = useFieldValue(`media_type`);
  const [startTime, setStartTime] = useFieldValue(`start_time`);
  const [endTime, setEndTime] = useFieldValue(`end_time`);
  const [file] = useFieldValue(`file`);
  const [, setVolume] = useFieldValue(`volume`);
  const [durationInSec] = useFieldValue(`audio_length_sec`);
  const styles = useStyles();

  useEffect(() => {
    if (typeof file !== "string") setVolume(1);
  }, [file]);

  if (mediaType !== "audio") return <FileEdit />;
  return (
    <Card variant="outlined" style={{ marginBottom: 28, width: "100%" }}>
      <CardContent>
        <Typography variant="h6">Audio</Typography>
        <Grid container spacing={3}>
          <Grid container size={{ xs: 12 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <FileEdit />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                <VolumeSlider />
                <CustomSlider
                  vertical
                  icon={<LineWeightIcon />}
                  field={`weight`}
                  label="Weight"
                  defaultValue={50}
                />
              </Stack>
            </Grid>
          </Grid>
          <Grid container className={styles.timesContainer} spacing={0}>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof startTime === 'number' ? startTime.toFixed(2) : '0.00'}
                variant="filled"
                label="Start"
                fullWidth
                InputProps={{ readOnly: true, className: styles.inputLeft }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof endTime === 'number' ? endTime.toFixed(2) : '0.00'}
                variant="filled"
                label="End"
                fullWidth
                InputProps={{ readOnly: true, className: styles.inputRight }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof durationInSec === 'number' ? durationInSec.toFixed(2) : '0.00'}
                variant="filled"
                label="Audio Length (s)"
                fullWidth
                InputProps={{ className: styles.inputBottom, readOnly: true }}
                inputProps={{ style: { color: 'rgba(0,0,0,0.6)' } }}
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
    borderBottomRightRadius: 0,
    border: "none",
    "& .MuiFilledInput-root": {
      borderRadius: 0,
    },
  },
  inputRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    border: "none",
    "& .MuiFilledInput-root": {
      borderRadius: 0,
    },
  },
  inputBottom: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    "& .MuiFilledInput-root": {
      borderRadius: 0,
    },
  },
  timesContainer: {
    borderRadius: theme.shape?.borderRadius || 4,
    border: "1px solid",
    borderColor: "rgba(0, 0, 0, 0.47)",
    margin: 0,
    padding: 0,
    "& .MuiGrid-item": {
      padding: 0,
    },
  },
  labelStyle: {
    fontSize: 16,
  },
}));
