import {
  Box,
  Card,
  CardContent,
  Grid,
  Slider,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import useFieldValue from "hooks/useFieldValue";
import React, { useState } from "react";
import { FileField, FileInput, TextInput } from "react-admin";
import SpeakerAudioPlayer from "./SpeakerAudioPlayer";

const SpeakerAudioControls = (): JSX.Element => {
  const [file] = useFieldValue<{
    src?: string;
  }>(`file`);

  const [uri] = useFieldValue(`uri`);

  const [sourceMode, setSourceMode] = useState<`UPLOAD` | `URI`>(
    uri ? "URI" : `UPLOAD`
  );
  const handleChange = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    event: React.ChangeEvent<{}>,
    newValue: `UPLOAD` | `URI`
  ) => {
    setSourceMode(newValue);
  };

  const [minVolume, setMinVolume] = useFieldValue<number>(`minvolume`);
  const [maxVolume, setMaxVolume] = useFieldValue<number>(`maxvolume`);
  const [range, setRange] = useState([minVolume || 0.1, maxVolume || 0.5]);

  const handleRangeChange = (event: unknown, newValue: number | number[]) => {
    if (!Array.isArray(newValue)) return;
    setRange(newValue);
    setMinVolume(newValue[0]);
    setMaxVolume(newValue[1]);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container direction="row">
          <Grid item xs={12} md={12}>
            <Tabs value={sourceMode} onChange={handleChange}>
              <Tab label={`UPLOAD`} value={"UPLOAD"} />
              <Tab label={`URI`} value={"URI"} />
            </Tabs>

            <TabPanel value={`UPLOAD`} current={sourceMode}>
              <FileInput source="file" accept={".mp3,.wav"} multiple={false}>
                <FileField source="src" title="title" fullWidth />
              </FileInput>
            </TabPanel>
            <TabPanel value={`URI`} current={sourceMode}>
              <TextInput source="uri" required label="File URI" fullWidth />
              <TextInput source="backupuri" label="Back up URI" fullWidth />
            </TabPanel>

            <Box>
              <SpeakerAudioPlayer
                src={sourceMode == "UPLOAD" ? file?.src : uri}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            Volume Range
          </Grid>
          <Grid
            xs={12}
            md={12}
            item
            container
            direction="row"
            spacing={3}
            wrap="nowrap"
          >
            <Grid item>
              <VolumeUpIcon />
            </Grid>
            <Grid item style={{ flexGrow: 1 }}>
              <Slider
                value={range}
                defaultValue={[0.1, 0.5]}
                onChange={handleRangeChange}
                valueLabelDisplay="auto"
                step={0.01}
                min={0}
                max={1}
                aria-labelledby="range-slider"
              />
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SpeakerAudioControls;
function TabPanel(props: {
  children: React.ReactNode;
  value: string;
  current?: string;
}) {
  const { children, value, current } = props;

  return (
    <div role="tabpanel" hidden={value !== current}>
      {value === current && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}
