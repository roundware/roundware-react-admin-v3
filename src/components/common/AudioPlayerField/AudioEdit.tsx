import {
  CircularProgress,
  Grid,
  IconButton,
  Slider,
  Tooltip,
  Typography,
} from "@material-ui/core";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ResetIcon from "@material-ui/icons/Restore";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useField } from "react-final-form";
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

const AudioEditField = ({ size = "medium", buttons, ...props }: PropTypes) => {
  const {
    input: { onChange, value },
  } = useField(`file`);
  const {
    input: { value: start_time, onChange: changeStartTime },
  } = useField(`start_time`);
  const {
    input: { value: end_time, onChange: changeEndTime },
  } = useField(`end_time`);
  const {
    input: { value: id },
  } = useField(`id`);
  const [durationInSec, setDurationInSec] = useFieldValue(
    `audio_length_in_seconds`
  );

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

  const [volume, setVolume] = useFieldValue(`volume`);

  const audioSrc = typeof value?.src === "string" ? value.src : value;
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

        // wavesurferRef.current.on("region-removed", (region) => {
        //   console.log("region-removed --> ", region);
        // });

        // wavesurferRef.current.on("loading", (data) => {
        //   console.log("loading --> ", data);
        // });
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
    if (wavesurferRef && wavesurferRef.current && audioSrc) {
      setLoading(true);
      setDurationInSec(0);
      changeEndTime(0);
      changeStartTime(0);
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
    console.log(start, end);
    changeStartTime(Number(start?.toFixed(2)));
    changeEndTime(Number(end?.toFixed(2)));
  };

  const resetRange = () => {
    changeStartTime(0);
    changeEndTime(Number(wavesurferRef?.current?.getDuration()?.toFixed(2)));
  };

  const handleOnZoom = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (wavesurferRef?.current && event && !Array.isArray(value)) {
      wavesurferRef.current?.zoom(value * (value / 10));
    }
  };

  if (!audioSrc) return null;
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

        <Grid item container justifyContent="space-between" direction="row">
          <Grid
            item
            justifyContent="center"
            alignItems="center"
            direction="row"
            container
            wrap={"nowrap"}
            xs={12}
            md={8}
          >
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Grid item>
                  <Tooltip title="Reset Range">
                    <IconButton onClick={resetRange}>
                      <ResetIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip title={playing ? `Pause Audio` : `Play Audio`}>
                    <IconButton onClick={handlePlay} size={size}>
                      {playing ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </Tooltip>
                </Grid>
                {buttons?.map((b) => (
                  <Grid item key={b?.toString()}>
                    {b}
                  </Grid>
                ))}
              </>
            )}
          </Grid>
          {audioSrc && !loading && (
            <Grid
              item
              container
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
              md={4}
              xs={12}
            >
              <Grid item>
                <ZoomOutIcon />
              </Grid>
              <Grid item style={{ flexGrow: 1 }}>
                <Slider onChange={handleOnZoom} />
              </Grid>
              <Grid item>
                <ZoomInIcon />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default AudioEditField;
