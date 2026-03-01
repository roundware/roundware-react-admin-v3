import { Mic, MicOff } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import Wavesurfer from "@wavesurfer/react";
import useBoolean from "hooks/useBoolean";
import React from "react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
type Props = {
  onFinish: (uri: Blob) => void;
};

const AudioRecorder = ({ onFinish }: Props) => {
  const isRecording = useBoolean(false);

  // Keep refs to wavesurfer and the record plugin instance
  const wsRef = React.useRef<any>(null);
  const recordPluginRef = React.useRef<any>(null);
  const onFinishRef = React.useRef(onFinish);
  const endListenerRef = React.useRef<((blob: Blob) => void) | null>(null);

  // Update the ref when onFinish changes
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Create plugin once and store in ref — survives StrictMode double-mount
  const plugins = React.useMemo(() => {
    if (recordPluginRef.current) {
      return [recordPluginRef.current];
    }
    const record = RecordPlugin.create({
      mimeType: "audio/webm",
      scrollingWaveform: true,
      renderRecordedAudio: false,
      bufferSize: 2048,
      audioBitsPerSecond: 128000,
    });
    recordPluginRef.current = record;
    return [record];
  }, []);

  const handleReady = React.useCallback((ws: any) => {
    wsRef.current = ws;
    const record = recordPluginRef.current;
    if (!record) return;

    // Remove previous listener to avoid duplicates (StrictMode re-mounts)
    if (endListenerRef.current) {
      record.un("record-end", endListenerRef.current);
    }

    // Use `on` (not `once`) so the listener persists across multiple recordings
    const onEnd = (blob: Blob) => {
      onFinishRef.current(blob);
    };
    endListenerRef.current = onEnd;
    record.on("record-end", onEnd);
  }, []);

  // No cleanup effect — the <Wavesurfer> component manages its own lifecycle.
  // Manually destroying the plugin here breaks React 18 StrictMode because the
  // cleanup fires between the simulated unmount/remount cycle, nullifying the
  // plugin ref while useMemo does not re-run to recreate it.

  // Start/stop mic + recording
  const toggleRecording = async () => {
    const record = recordPluginRef.current;
    if (!record) {
      console.error("AudioRecorder: No record plugin available");
      return;
    }

    try {
      if (!isRecording.value) {
        await record.startRecording({ audio: true });
        isRecording.setTrue();
      } else {
        await record.stopRecording();
        isRecording.setFalse();
      }
    } catch (e) {
      console.error("AudioRecorder: Recording error:", e);
      isRecording.setFalse();
    }
  };

  return (
    <Stack sx={{ width: "100%" }} spacing={2}>
      <Box>
        <Wavesurfer
          plugins={plugins}
          onReady={handleReady}
          height={96}
          width={600}
        />
      </Box>
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          startIcon={isRecording.value ? <MicOff /> : <Mic />}
          color={isRecording.value ? "error" : "primary"}
          onClick={toggleRecording}
        >
          {isRecording.value ? "Stop" : "Start"} Recording
        </Button>
      </Box>
    </Stack>
  );
};

export default React.memo(AudioRecorder);
