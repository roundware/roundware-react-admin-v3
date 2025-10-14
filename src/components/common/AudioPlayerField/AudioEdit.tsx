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
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Region, WaveForm, WaveSurfer } from "wavesurfer-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline";
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

  const [volume] = useFieldValue<number>(`volume`);
  const [progress, setProgress] = useState(0);
  const audioSrc = typeof value != "string" ? value.src : value;
  const [loading, setLoading] = useState(true);
  const wavesurferRef = React.useRef<any>();
  const handleMount = React.useCallback(
    (waveSurfer: any) => {
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        if (audioSrc) {
          wavesurferRef.current.load(audioSrc);
        }

        // wavesurferRef.current.on("region-created", regionCreatedHandler);

        wavesurferRef.current.on("ready", () => {
          setLoading(false);
          wavesurferRef.current.currentTime = start_time;
        });

        wavesurferRef.current.on("loading", (p: number) => {
          setProgress(p);
        });
        wavesurferRef.current.on("error", (e: Error) => console.error(e));
      }
    },
    [value]
  );

  const [playing, setPlaying] = useState(false);
  const handlePlay = () => {
    if (playing) {
      setPlaying(false);
      return wavesurferRef.current.pause();
    }
    const region = Object.values(wavesurferRef.current.regions.list)[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    region.play();
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
      const audioDuration = wavesurferRef.current.getDuration()?.toFixed(2);
      setDurationInSec(Number(audioDuration));
      changeEndTime(end_time || 0);
      changeStartTime(start_time || 0);
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
    if (wavesurferRef?.current && event && !Array.isArray(value)) {
      wavesurferRef.current?.zoom(value * (value / 10));
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
        <Grid item style={{ height: loading ? 0 : `initial` }}>
          <WaveSurfer plugins={plugins} onMount={handleMount}>
            <WaveForm
              id={"waveform-" + id}
              fillParent={true}
              mediaControls={true}
              height={size === "small" ? 64 : 128}

              // maxCanvasWidth={size === "small" ? 4000 : 6000}
            >
              <Region
                start={start_time}
                end={end_time}
                onUpdateEnd={onRangeUpdate}
              />
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

export default AudioEditField;
