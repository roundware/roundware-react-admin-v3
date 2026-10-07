import LineWeightIcon from "@mui/icons-material/LineWeight";
import {
    CardContent,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
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

  useEffect(() => {
    if (typeof file !== "string") setVolume(1);
  }, [file]);

  if (mediaType !== "audio") return <FileEdit />;
  return (
    <Card variant="outlined" style={{ marginBottom: 28, width: "100%" }}>
      <CardContent>
        <Typography variant="h6">Audio</Typography>
        <Grid container spacing={3}>
          {/* The waveform gets the card's full width; volume and weight sit
              beneath it side by side. (They were vertical sliders in a
              column beside it, which the waveform ran under.) */}
          <Grid size={{ xs: 12 }}>
            <FileEdit />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
              <VolumeSlider />
              <CustomSlider icon={<LineWeightIcon />} field={`weight`} label="Weight" defaultValue={50} />
            </Stack>
          </Grid>
          <Grid container sx={timesContainerSx} spacing={0}>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof startTime === 'number' ? startTime.toFixed(2) : '0.00'}
                variant="filled"
                label="Start"
                fullWidth
                InputProps={{ readOnly: true, sx: inputLeftSx }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof endTime === 'number' ? endTime.toFixed(2) : '0.00'}
                variant="filled"
                label="End"
                fullWidth
                InputProps={{ readOnly: true, sx: inputRightSx }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                value={typeof durationInSec === 'number' ? durationInSec.toFixed(2) : '0.00'}
                variant="filled"
                label="Audio Length (s)"
                fullWidth
                InputProps={{ sx: inputBottomSx, readOnly: true }}
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

// Three read-only fields joined into one box. (Were makeStyles classes, from
// @mui/styles, which gets no theme under MUI v7 and crashed the form.)
const square = { "& .MuiFilledInput-root": { borderRadius: 0 } };
const inputLeftSx = { borderTopRightRadius: 0, borderBottomRightRadius: 0, border: "none", ...square };
const inputRightSx = { borderRadius: 0, border: "none", ...square };
const inputBottomSx = { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, ...square };
const timesContainerSx = {
  borderRadius: 1,
  border: "1px solid",
  borderColor: "rgba(0, 0, 0, 0.47)",
  m: 0,
  p: 0,
};
