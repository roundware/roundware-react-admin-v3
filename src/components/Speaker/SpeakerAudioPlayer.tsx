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
import useFieldValue from "hooks/useFieldValue";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Region, WaveForm, WaveSurfer } from "wavesurfer-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline";

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

  const plugins = [
    {
      plugin: RegionsPlugin,
      options: { dragSelection: false },
    },
    {
      plugin: TimelinePlugin,
      options: {
        container: "#wavesurfer-timeline-" + id,
      },
    },
  ];

  const [minvolume] = useFieldValue(`minvolume`);
  const [maxvolume] = useFieldValue(`maxvolume`);

  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = React.useRef<any>();
  const handleMount = React.useCallback(
    (waveSurfer: unknown) => {
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        if (src) {
          wavesurferRef.current.load(src);
        }

        // wavesurferRef.current.on("region-created", regionCreatedHandler);

        wavesurferRef.current.on("ready", () => {
          setLoading(false);
        });

        wavesurferRef.current.on("loading", (p: number) => {
          setProgress(p);
        });


      }
    },
    [src]
  );

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
    if (wavesurferRef && wavesurferRef.current && src) {
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
    if (wavesurferRef && wavesurferRef.current) {
      wavesurferRef.current?.setVolume(currentVolume);
    }
  }, [currentVolume]);

  const handleOnZoom: SliderProps<typeof Slider>[`onChange`] = (
    event,
    value
  ) => {
    if (wavesurferRef?.current && event && !Array.isArray(value)) {
      wavesurferRef.current?.zoom(value * (value / 10));
    }
  };

  if (!src) return null;
  return (
    <div style={{ width: size === "small" ? "280px" : "100%", minHeight: 160 }}>
      <Grid container spacing={2} direction="column">
        <Grid
          item
          style={{
            visibility: loading ? "hidden" : "visible",
            height: loading ? 0 : "initial",
          }}
        >
          <WaveSurfer plugins={plugins} onMount={handleMount}>
            <WaveForm
              id={"waveform-" + id}
              fillParent={true}
              mediaControls={true}
              height={size === "small" ? 64 : 128}

              // maxCanvasWidth={size === "small" ? 4000 : 6000}
            >
              <Region />
            </WaveForm>
            <div id={"wavesurfer-timeline-" + id}></div>
          </WaveSurfer>
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
                min={1}
                max={100}
                defaultValue={10}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}x`}
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
