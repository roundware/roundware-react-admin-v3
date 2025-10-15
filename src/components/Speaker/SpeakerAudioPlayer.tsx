import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
    Box,
    Grid,
    IconButton,
    LinearProgress,
    Slider,
    SliderProps,
    Tooltip,
    Typography,
} from "@mui/material";
import Wavesurfer from "@wavesurfer/react";
import useFieldValue from "hooks/useFieldValue";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

interface PropTypes {
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
  src?: string | unknown;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const SpeakerAudioPlayer = ({
  size = "medium",
  src,
  buttons,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...props
}: PropTypes) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [id, setId] = useFieldValue(`id`);

  // Timeline and Regions plugins
  const plugins = useMemo(() => [
    TimelinePlugin.create(),
    RegionsPlugin.create()
  ], [id]);

  const [minvolume] = useFieldValue(`minvolume`);
  const [maxvolume] = useFieldValue(`maxvolume`);
  const [startTime, setStartTime] = useFieldValue(`start_time`);
  const [endTime, setEndTime] = useFieldValue(`end_time`);

  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = React.useRef<any>();
  const handleReady = React.useCallback((ws: any) => {
    wavesurferRef.current = ws;
    setLoading(false);
    ws.on("loading", (p: number) => setProgress(p));
    
    // Set initial zoom immediately when ready
    ws.zoom(zoomLevel);
    
    // Force redraw to ensure waveform renders
    setTimeout(() => {
      if (ws.renderer && ws.renderer.redraw) {
        ws.renderer.redraw();
      }
    }, 100);
    
    // Also set zoom when decode completes
    ws.once("decode", () => {
      ws.zoom(zoomLevel);
      if (ws.renderer && ws.renderer.redraw) {
        ws.renderer.redraw();
      }
      
      // Create region for start/end time control
      const regionsPlugin = ws.plugins.find(p => p.constructor.name === 'RegionsPlugin');
      if (regionsPlugin && startTime !== undefined && endTime !== undefined) {
        // Clear any existing regions
        regionsPlugin.clearRegions();
        
        // Create region based on start_time and end_time values
        const region = regionsPlugin.addRegion({
          start: startTime || 0,
          end: endTime || ws.getDuration() || 10,
          color: 'rgba(255, 0, 0, 0.3)',
          drag: true,
          resize: true,
          content: 'Start/End Time'
        });
        
        // Handle region updates
        regionsPlugin.on('region-updated', (updatedRegion) => {
          if (updatedRegion === region) {
            setStartTime(updatedRegion.start);
            setEndTime(updatedRegion.end);
          }
        });
      }
    });
  }, [zoomLevel, startTime, endTime, setStartTime, setEndTime]);

  const [playing, setPlaying] = useState(false);
  const handlePlay = () => {
    if (playing) {
      setPlaying(false);
      return wavesurferRef.current.pause();
    }
    wavesurferRef.current.play();
    setPlaying(true);
  };

  useEffect(() => {
    if (wavesurferRef?.current && src) {
      wavesurferRef.current.load(src);
    }
  }, [src, wavesurferRef]);


  useEffect(() => {
    return () => {
      if (wavesurferRef && wavesurferRef.current) wavesurferRef.current.pause();
    };
  }, []);

  const [currentVolume, setCurrentVolume] = useState(maxvolume);

  useEffect(() => {
    if (wavesurferRef?.current) wavesurferRef.current.setVolume(currentVolume);
  }, [currentVolume]);

  const handleOnZoom: SliderProps<typeof Slider>[`onChange`] = (
    event,
    value
  ) => {
    if (event && !Array.isArray(value)) {
      // Match the example: 10-1000 pixels per second
      const newZoomLevel = Math.max(10, Math.min(1000, value));
      setZoomLevel(newZoomLevel);
      
      if (wavesurferRef?.current) {
        try {
          const ws = wavesurferRef.current;
          // Use the zoom method directly as in the example
          ws.zoom(newZoomLevel);
        } catch (error) {
          console.error('Zoom error:', error);
        }
      }
    }
  };

  if (!src) return null;
  return (
    <div style={{ 
      width: size === "small" ? "280px" : "100%", 
      minHeight: 160,
      maxWidth: "100%",
      overflow: "hidden",
      position: "relative"
    }}>
      <Grid container spacing={2} direction="column">
        <Grid
          item
          style={{
            visibility: loading ? "hidden" : "visible",
            height: loading ? 0 : "initial",
            width: "90%",
            maxWidth: "90%",
            margin: "0 auto"
          }}
        >
          <Wavesurfer
            plugins={plugins}
            onReady={handleReady}
            height={size === "small" ? 64 : 128}
            width={size === "small" ? 280 : 800}
            url={typeof src === 'string' ? src : undefined}
            scrollbar={true}
            fillParent={false}
            autoCenter={true}
          />
        </Grid>

        {/* Playback Controls */}
        <Grid item xs={12}>
          {loading ? (
            <Box>
              <Typography>Loading Audio {progress} %</Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ width: '100%' }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
              <Tooltip title="Play at Min Volume">
                <IconButton
                  onClick={() => setCurrentVolume(minvolume)}
                  size="large"
                >
                  <VolumeDown />
                </IconButton>
              </Tooltip>
              <Tooltip title="Play at Max Volume">
                <IconButton
                  onClick={() => setCurrentVolume(maxvolume)}
                  size="large"
                >
                  <VolumeUp />
                </IconButton>
              </Tooltip>
              <Tooltip title={playing ? `Pause Audio` : `Play Audio`}>
                <IconButton onClick={handlePlay} size={size}>
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Tooltip>
              {buttons?.map((b) => (
                <Box key={b?.toString()}>
                  {b}
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Zoom Controls */}
        {src && !loading && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
              <ZoomOutIcon />
              <Slider 
                onChange={handleOnZoom} 
                sx={{ flexGrow: 1 }}
                min={10}
                max={1000}
                value={zoomLevel}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}px/s`}
              />
              <ZoomInIcon />
            </Box>
          </Grid>
        )}

      </Grid>
    </div>
  );
};

export default React.memo(SpeakerAudioPlayer);
