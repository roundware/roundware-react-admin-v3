import { Mic, MicOff } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Wavesurfer from "@wavesurfer/react";
import useBoolean from "hooks/useBoolean";
import React from "react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
type Props = {
  onFinish: (uri: Blob) => void;
};

const useStyles = makeStyles({
  container: {
    width: "100%",
  },
});
const AudioRecorder = ({ onFinish }: Props) => {
  const isRecording = useBoolean(false);
  const styles = useStyles();

  // Keep refs to wavesurfer and the record plugin instance
  const wsRef = React.useRef<any>(null);
  const recordPluginRef = React.useRef<any>(null);
  const onFinishRef = React.useRef(onFinish);
  const listenersAddedRef = React.useRef(false);
  
  // Update the ref when onFinish changes
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Create plugin instances once and store in ref to prevent re-creation
  const plugins = React.useMemo(() => {
    if (recordPluginRef.current) {
      return [recordPluginRef.current];
    }
    const record = RecordPlugin.create({
      // Use WebM format which is widely supported
      mimeType: "audio/webm",
      // Enable scrolling waveform display during recording
      scrollingWaveform: true,
      // Don't auto-render the recorded audio to avoid delay
      renderRecordedAudio: false,
      // Use smaller buffer for faster processing
      bufferSize: 2048,
      // Keep high quality audio
      audioBitsPerSecond: 128000,
    });
    recordPluginRef.current = record;
    return [record];
  }, []);

  const handleReady = React.useCallback((ws: any) => {
    wsRef.current = ws;
    const record = recordPluginRef.current;
    if (!record) {
      console.error('AudioRecorder: Record plugin not found');
      return;
    }

    // Only add listeners once to prevent duplicates
    if (!listenersAddedRef.current) {
      // Emit blob when recording stops (use once to prevent multiple calls)
      record.once("record-end", (blob: Blob) => {
        console.log('AudioRecorder: Record ended, blob size:', blob.size);
        onFinishRef.current(blob);
      });

      // Add debugging for processing events
      record.once("record-start", () => {
        console.log('AudioRecorder: Recording started');
      });

      record.once("record-stop", () => {
        console.log('AudioRecorder: Recording stopped, processing...');
      });

      listenersAddedRef.current = true;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recordPluginRef.current) {
        recordPluginRef.current.destroy();
        recordPluginRef.current = null;
      }
    };
  }, []);

  // Start/stop mic + recording
  const toggleRecording = async () => {
    const record = recordPluginRef.current;
    if (!record) {
      console.error('AudioRecorder: No record plugin available');
      return;
    }

    try {
      if (!isRecording.value) {
        console.log('AudioRecorder: Starting recording...');
        // Start the mic and recording as in Wavesurfer example
        await record.startRecording({ audio: true });
        isRecording.setTrue();
        console.log('AudioRecorder: Recording started successfully');
      } else {
        console.log('AudioRecorder: Stopping recording...');
        await record.stopRecording();
        isRecording.setFalse();
        console.log('AudioRecorder: Recording stopped successfully');
      }
    } catch (e) {
      console.error('AudioRecorder: Recording error:', e);
      isRecording.setFalse();
    }
  };

  return (
    <Stack className={styles.container} spacing={2}>
      <Box>
        <Wavesurfer
          plugins={plugins}
          onReady={handleReady}
          height={96}
          // Render area width; keep responsive within parent
          width={600}
        />
      </Box>
      <Box display={"flex"} justifyContent="center">
        <Button
          variant="contained"
          startIcon={isRecording.value ? <MicOff /> : <Mic />}
          color={isRecording.value ? `error` : `primary`}
          onClick={toggleRecording}
        >
          {isRecording.value ? `Stop` : `Start`} Recording
        </Button>
      </Box>
    </Stack>
  );
};

export default React.memo(AudioRecorder);
