import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
import { useField } from "react-final-form";
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import { useRecordContext } from "react-admin";
import { IconButton, Grid } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
const plugins = [
  {
    plugin: RegionsPlugin,
    options: { dragSelection: false },
  },
];

interface PropTypes {
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
}

const AudioEditField = ({ size = "medium", buttons, ...props }: PropTypes) => {
  const {
    input: { onChange, value },
  } = useField(`file`);
  const {
    input: { value: start_time },
  } = useField(`start_time`);
  const {
    input: { value: end_time },
  } = useField(`end_time`);
  const {
    input: { value: id },
  } = useField(`id`);

  const audioSrc = typeof value?.src === "string" ? value.src : value;

  const wavesurferRef = React.useRef<any>();
  const handleMount = React.useCallback(
    (waveSurfer: any) => {
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        if (audioSrc) {
          wavesurferRef.current.load(audioSrc);
        }

        // wavesurferRef.current.on("region-created", regionCreatedHandler);

        // wavesurferRef.current.on("ready", () => {
        //   console.log("WaveSurfer is ready");
        // });

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
    wavesurferRef.current.play();
    setPlaying(true);
  };

  useEffect(() => {
    if (wavesurferRef && wavesurferRef.current && audioSrc) {
      wavesurferRef.current.load(audioSrc);
    }
  }, [audioSrc]);

  if (!audioSrc) return null;
  return (
    <div style={{ width: size === "small" ? "280px" : "360px" }}>
      <Grid container spacing={2} direction="column">
        <Grid item>
          <WaveSurfer plugins={plugins} onMount={handleMount}>
            <WaveForm
              id={"waveform-" + id}
              fillParent={true}
              mediaControls={true}
              height={size === "small" ? 64 : 128}
              // maxCanvasWidth={size === "small" ? 4000 : 6000}
            >
              <Region start={start_time} end={end_time} />
            </WaveForm>
          </WaveSurfer>
        </Grid>
        <Grid
          item
          justifyContent="center"
          alignItems="center"
          direction="row"
          container
        >
          <Grid item>
            <IconButton onClick={handlePlay} size={size}>
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            {buttons}
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default AudioEditField;
