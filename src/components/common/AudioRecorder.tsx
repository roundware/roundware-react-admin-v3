import { Mic, MicOff } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import useBoolean from "hooks/useBoolean";
import React from "react";
import { ReactMic } from "react-mic";
type Props = {
  onFinish: (uri: Blob) => void;
};

const AudioRecorder = ({ onFinish }: Props) => {
  const isRecording = useBoolean(false);
  const theme = useTheme();

  return (
    <Stack>
      <ReactMic
        record={isRecording.value} // defaults -> false.  Set to true to begin recording
        visualSetting="sinewave" // defaults -> "sinewave".  Other option is "frequencyBars"
        onStop={(e) => {
          onFinish(e.blob);
        }}
        strokeColor={theme.palette.primary.main} // sinewave or frequency bar color
        backgroundColor={theme.palette.background.paper}
        mimeType="audio/webm" // defaults -> "audio/webm".  Set to "audio/wav" for WAV or "audio/mp3" for MP3 audio format (available in React-Mic-Gold)
      />
      <Box display={"flex"} justifyContent="center">
        <Button
          variant="contained"
          startIcon={isRecording.value ? <MicOff /> : <Mic />}
          color={isRecording.value ? `error` : `primary`}
          onClick={isRecording.toggle}
        >
          {isRecording.value ? `Stop` : `Start`} Recording
        </Button>
      </Box>
    </Stack>
  );
};

export default AudioRecorder;
