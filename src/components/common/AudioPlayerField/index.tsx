import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Grid, IconButton, LinearProgress, Slider, SliderProps } from "@mui/material";
import Wavesurfer from "@wavesurfer/react";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import useFieldValue from "hooks/useFieldValue";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RaRecord, useRecordContext } from "react-admin";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

interface PropTypes {
  source: string;
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
  inEditView?: boolean;
}

const useEditContext = ({ source }: PropTypes) => {
  const [assetId] = useFieldValue<string>(source);
  const [asset, setAsset] = useState<RaRecord>({
    file: "",
    start_time: 0,
    end_time: 0,
    id: 0,
  });
  const dataProvider = useRoundwareDataProvider();
  useEffect(() => {
    dataProvider
      .getOne(`assets`, {
        id: assetId,
      })
      .then(({ data }) => setAsset(data));
  }, [assetId]);

  return asset;
};

const hooks = {
  useRecordContext,
  useEditContext,
};
const AudioPlayerField = ({
  size = "small",
  buttons,
  inEditView,
  ...props
}: PropTypes): JSX.Element | null => {
  const { file, start_time, end_time, ...record } =
    hooks[inEditView ? `useEditContext` : `useRecordContext`](props);

  // Timeline and Regions plugins
  const plugins = useMemo(() => [
    TimelinePlugin.create(),
    RegionsPlugin.create()
  ], []);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  // Get start/end time from the record context
  const startTime = record?.start_time || 0;
  const endTime = record?.end_time || 10;

  const wavesurferRef = React.useRef<any>();

  const handleReady = useCallback((ws: any) => {
    wavesurferRef.current = ws;
    setLoading(false);
    ws.on("loading", (n: number) => setProgress(n));
    
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
      if (regionsPlugin) {
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
        
        // Handle region updates - for now just log, can be enhanced later
        regionsPlugin.on('region-updated', (updatedRegion) => {
          if (updatedRegion === region) {
            console.log('Region updated:', updatedRegion.start, updatedRegion.end);
          }
        });
      }
    });
  }, [zoomLevel, startTime, endTime]);

  const [playing, setPlaying] = useState(false);
  const handlePlay = () => {
    if (!wavesurferRef.current) return;
    if (playing) {
      setPlaying(false);
      return wavesurferRef.current.pause();
    }
    wavesurferRef.current.play();
    setPlaying(true);
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

  useEffect(() => {
    if (wavesurferRef && wavesurferRef.current && file) {
      setLoading(true);
      wavesurferRef.current.load(file);
    }
  }, [file]);
  useEffect(() => {
    return () => {
      if (wavesurferRef && wavesurferRef.current) wavesurferRef.current.pause();
    };
  }, []);

  if (!file) return null;
  return (
    <div
      style={{ 
        width: size === "small" ? "280px" : "100%", 
        minHeight: 160,
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative"
      }}
    >
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
            url={file}
            scrollbar={true}
            fillParent={false}
            autoCenter={true}
          />
        </Grid>
        <Grid
          item
          justifyContent="center"
          alignItems="center"
          direction="row"
          container
        >
          {loading ? (
            <LinearProgress
              variant="determinate"
              style={{ flexGrow: 1 }}
              value={progress}
            />
          ) : (
            <>
              <Grid item>
                <IconButton onClick={handlePlay} size={size}>
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Grid>
              {buttons?.map((b) => (
                <Grid item key={b?.toString()}>
                  {b}
                </Grid>
              ))}
            </>
          )}
        </Grid>

        {/* Zoom Controls - only show in edit view */}
        {file && !loading && inEditView && (
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

AudioPlayerField.propTypes = {
  label: PropTypes.string,
  record: PropTypes.object,
  source: PropTypes.string.isRequired,
};

export default AudioPlayerField;
