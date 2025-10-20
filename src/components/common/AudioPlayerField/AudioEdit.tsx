/* eslint-disable @typescript-eslint/no-explicit-any */
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ResetIcon from "@mui/icons-material/Restore";
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
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import useFieldValue from "../../../hooks/useFieldValue";

interface PropTypes {
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
}
type FileType2 = {
  src: string;
};
const AudioEditField = ({
  size = "medium",
  buttons,
}: PropTypes): JSX.Element | null => {
  const [value] = useFieldValue<string | FileType2>(`file`);
  const [start_time, changeStartTime] = useFieldValue<number>(`start_time`);
  const [end_time, changeEndTime] = useFieldValue<number>(`end_time`);
  
  
  
  

  const [id] = useFieldValue<number>(`id`);
  const [, setDurationInSec] = useFieldValue(`audio_length_in_seconds`);

  // Keep a reference to the Regions plugin instance
  const regionsPluginRef = React.useRef<any>(null);

  // Timeline and Regions plugins
  const plugins = useMemo(() => {
    const timeline = TimelinePlugin.create();
    const regions = RegionsPlugin.create();
    regionsPluginRef.current = regions;
    return [timeline, regions];
  }, [id]);

  const [volume] = useFieldValue<number>(`volume`);
  const [progress, setProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const audioSrc = typeof value != "string" ? value.src : value;
  const [loading, setLoading] = useState(true);
  const wavesurferRef = React.useRef<any>();
  const handleReady = useCallback((ws: any) => {
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
      
      // Region creation is now handled by the useEffect, not here
      
    });
  }, [zoomLevel, start_time, end_time]);

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
    return () => {
      if (wavesurferRef && wavesurferRef.current) wavesurferRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef && wavesurferRef.current && audioSrc) {
      setLoading(true);
      wavesurferRef.current.load(audioSrc);
    }
  }, [audioSrc]);

  useEffect(() => {
    // when no end_time is specified make sure to set to it to the audio length
    if (loading) return;
    const audioDuration = wavesurferRef.current.getDuration()?.toFixed(2);
    setDurationInSec(Number(audioDuration));

    if (!end_time) changeEndTime(Number(audioDuration));
    if (!start_time && typeof start_time !== "number") changeStartTime(0);
  }, [end_time, loading]);

  useEffect(() => {
    if (wavesurferRef && wavesurferRef.current) {
      wavesurferRef.current?.setVolume(volume);
    }
  }, [volume]);

  // Recreate region when start_time or end_time changes
  useEffect(() => {
    
    if (wavesurferRef?.current && !loading) {
      const ws = wavesurferRef.current;
      const regionsPlugin = regionsPluginRef.current;
      
      if (regionsPlugin) {
        // Clear existing regions
        regionsPlugin.clearRegions();
        
        // Create new region with updated values
        const duration = ws.getDuration() || 10;
        const startValue = start_time || 0;
        const endValue = end_time || duration;
        
        try {
          const region = regionsPlugin.addRegion({
            start: startValue,
            end: endValue,
            color: 'rgba(102, 205, 170, 0.35)',
            drag: true,
            resize: true,
            content: 'Start/End Time'
          });
          
          // Handle region updates
          regionsPlugin.on('region-updated', (updatedRegion) => {
            if (updatedRegion === region) {
              changeStartTime(Number(updatedRegion.start.toFixed(2)));
              changeEndTime(Number(updatedRegion.end.toFixed(2)));
            }
          });
        } catch (error) {
          console.error('Error recreating region:', error);
        }
      }
    }
  }, [start_time, end_time, loading, changeStartTime, changeEndTime]);


  const onRangeUpdate = ({ start, end }: any) => {
    changeStartTime(Number(start?.toFixed(2)));
    changeEndTime(Number(end?.toFixed(2)));
  };

  const resetRange = () => {
    changeStartTime(0);
    changeEndTime(Number(wavesurferRef?.current?.getDuration()?.toFixed(2)));
  };

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

  if (!audioSrc) return <></>;
  return (
    <div style={{ width: size === "small" ? "280px" : "100%" }}>
      <Grid container spacing={2} direction="column">
        {!loading && (
          <Grid item>
            <Typography variant="subtitle2">
              Select a region to set Start Time and End Time
            </Typography>
          </Grid>
        )}
        <Grid 
          item 
          style={{ 
            height: loading ? 0 : `initial`,
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
            url={audioSrc}
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
              <Tooltip title="Reset Range">
                <IconButton onClick={resetRange} size="large">
                  <ResetIcon />
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
        {audioSrc && !loading && (
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

export default AudioEditField;
