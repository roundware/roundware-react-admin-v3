import { Delete } from "@mui/icons-material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Slider,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import AudioRecorder from "components/common/AudioRecorder";
import useFieldValue from "hooks/useFieldValue";
import React, { useState } from "react";
import { FileField, FileInput, TextInput } from "react-admin";
import SpeakerAudioPlayer from "./SpeakerAudioPlayer";

const SpeakerAudioControls = (): JSX.Element => {
  const [file, setFile] = useFieldValue<{
    src?: string;
  } | null>(`file`);

  const [uri] = useFieldValue(`uri`);
  const [setAs, setSetAs] = useFieldValue<string>(`set_as`, `uri`);

  const [sourceMode, setSourceMode] = useState<`UPLOAD` | `URI` | `RECORD`>(
    uri ? "URI" : `UPLOAD`
  );
  const handleChange = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    event: React.ChangeEvent<{}>,
    newValue: `UPLOAD` | `URI`
  ) => {
    setSourceMode(newValue);
  };

  const [minVolume, setMinVolume] = useFieldValue<number>(`min_volume`, 0.0);
  const [maxVolume, setMaxVolume] = useFieldValue<number>(`max_volume`, 1.0);
  const [range, setRange] = useState([
    typeof minVolume == "number" ? minVolume : 0.0,
    typeof maxVolume == "number" ? maxVolume : 1.0,
  ]);

  const handleRangeChange = (event: unknown, newValue: number | number[]) => {
    if (!Array.isArray(newValue)) return;
    setRange(newValue);
    setMinVolume(newValue[0]);
    setMaxVolume(newValue[1]);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={sourceMode} onChange={handleChange}>
        <Tab label={`UPLOAD`} value={"UPLOAD"} />
        <Tab label={`URI`} value={"URI"} />
        <Tab label="RECORD" value="RECORD" />
      </Tabs>

      <TabPanel value={`UPLOAD`} current={sourceMode}>
        <FileInput
          source="file"
          accept={".mp3,.wav,.m4a"}
          multiple={false}
        >
          <FileField source="src" title="title" fullWidth />
        </FileInput>
        <FormControl sx={{ mt: 1 }}>
          <FormLabel>Set uploaded audio as</FormLabel>
          <RadioGroup
            row
            value={setAs || "uri"}
            onChange={(e) => setSetAs(e.target.value)}
          >
            <FormControlLabel value="uri" control={<Radio />} label="URI" />
            <FormControlLabel value="backup_uri" control={<Radio />} label="Backup URI" />
          </RadioGroup>
        </FormControl>
      </TabPanel>

      <TabPanel value={`URI`} current={sourceMode}>
        <TextInput source="uri" required label="File URI" fullWidth />
        <TextInput source="backup_uri" label="Back up URI" fullWidth />
      </TabPanel>

      <TabPanel value={`RECORD`} current={sourceMode}>
        {!file ? (
          <AudioRecorder
            onFinish={(b) =>
              setFile({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                rawFile: new File([b], "admin_recorded"),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                name: `admin-${Math.random()}`.split(`.`, ``),
                src: URL.createObjectURL(b),
              })
            }
          />
        ) : (
          <Box>
            <Button
              color="error"
              onClick={() => setFile(null)}
              startIcon={<Delete />}
              sx={{ mb: 2 }}
            >
              Delete Recording
            </Button>
            <SpeakerAudioPlayer src={file.src} />
          </Box>
        )}
      </TabPanel>

      <Box sx={{ width: '100%', mt: 2 }}>
        <SpeakerAudioPlayer
          src={
            sourceMode == "UPLOAD" || (sourceMode == "RECORD" && !file)
              ? file?.src
              : sourceMode == "URI"
              ? uri
              : undefined
          }
        />
      </Box>

      {/* Volume Range - positioned below the audio player */}
      <Box sx={{ mt: 2, width: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Volume Range
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <VolumeUpIcon />
          <Box sx={{ flexGrow: 1, px: 1 }}>
            <Slider
              value={range}
              onChange={handleRangeChange}
              valueLabelDisplay="auto"
              step={0.01}
              min={0}
              max={1}
              aria-labelledby="range-slider"
            />
          </Box>
        </Box>
      </Box>
    </Box>
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
          {children}
        </Box>
      )}
    </div>
  );
}
