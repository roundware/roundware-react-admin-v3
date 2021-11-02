import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
import { useField } from "react-final-form";
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
// @ts-ignore
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import VolumeDown from "@material-ui/icons/VolumeDown";
import VolumeUp from "@material-ui/icons/VolumeUp";
import {
  IconButton,
  Grid,
  CircularProgress,
  Typography,
  Tooltip,
  Slider,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ResetIcon from "@material-ui/icons/Restore";
import useFieldValue from "hooks/useFieldValue";

interface PropTypes {
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
  src?: string | any;
}

const SpeakerAudioPlayer = ({
  size = "medium",
  src,
  buttons,
  ...props
}: PropTypes) => {
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

  const [minvolume, setMinVolume] = useFieldValue(`minvolume`);
  const [maxvolume, setmaxVolume] = useFieldValue(`maxvolume`);

  const [loading, setLoading] = useState(true);
  const wavesurferRef = React.useRef<any>();
  const handleMount = React.useCallback(
    (waveSurfer: any) => {
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        if (src) {
          wavesurferRef.current.load(src);
        }

        // wavesurferRef.current.on("region-created", regionCreatedHandler);

        wavesurferRef.current.on("ready", () => {
          setLoading(false);
        });

        // });

        // wavesurferRef.current.on("loading", (data) => {
        //   console.log("loading --> ", data);
        // });
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
      setLoading(true);
      wavesurferRef.current.load(src);
    }
  }, [src]);

  const [currentVolume, setCurrentVolume] = useState(maxvolume);

  useEffect(() => {
    if (wavesurferRef && wavesurferRef.current) {
      wavesurferRef.current?.setVolume(currentVolume);
    }
  }, [currentVolume]);

  const handleOnZoom = (
    event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (wavesurferRef?.current && event && !Array.isArray(value)) {
      wavesurferRef.current?.zoom(value * (value / 10));
    }
  };

  console.log(src);
  if (!src) return null;
  return (
    <div style={{ width: size === "small" ? "280px" : "100%" }}>
      <Grid container spacing={2} direction="column">
        <Grid item style={{ height: loading ? 0 : `initial` }}>
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
                  <Tooltip title="Play at Min Volume">
                    <IconButton onClick={() => setCurrentVolume(minvolume)}>
                      <VolumeDown />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip title="Play at Max Volume">
                    <IconButton onClick={() => setCurrentVolume(maxvolume)}>
                      <VolumeUp />
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
                  <Grid item>{b}</Grid>
                ))}
              </>
            )}
          </Grid>
          {src && !loading && (
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

export default SpeakerAudioPlayer;
