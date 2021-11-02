import React, { useState } from "react";
import { FileInput, TextInput, FileField } from "react-admin";
import {
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Typography,
  Box,
} from "@material-ui/core";
import CustomSlider from "components/common/CustomSlider";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import useFieldValue from "hooks/useFieldValue";
import SpeakerAudioPlayer from "./SpeakerAudioPlayer";
interface Props {}

const SpeakerAudioControls = (props: Props) => {
  const [sourceMode, setSourceMode] = useState<`UPLOAD` | `URI`>(`UPLOAD`);
  const handleChange = (
    event: React.ChangeEvent<{}>,
    newValue: `UPLOAD` | `URI`
  ) => {
    setSourceMode(newValue);
  };

  const [file, setFile] = useFieldValue(`file`);
  const [uri, seturi] = useFieldValue(`uri`);

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container direction="row">
          <Grid item xs={12} md={6}>
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
          <Grid
            xs={12}
            md={6}
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
                vertical
                icon={<VolumeUpIcon />}
              />
            </Grid>
            <Grid item>
              <CustomSlider
                defaultValue={50}
                label="Max Volume"
                field="maxvolume"
                vertical
                icon={<VolumeUpIcon />}
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
