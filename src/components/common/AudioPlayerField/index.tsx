import React, { useState } from "react";
import PropTypes from "prop-types";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import { useRecordContext } from "react-admin";
import { IconButton, Grid, LinearProgress } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
const plugins = [
  {
    plugin: RegionsPlugin,
    options: { dragSelection: false },
  },
];

interface PropTypes {
  source: string;
  size?: "small" | "medium";
  buttons?: React.ReactNode[];
}

const AudioPlayerField = ({
  size = "small",
  buttons,
  ...props
}: PropTypes): JSX.Element | null => {
  const { file, ...record } = useRecordContext(props);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = React.useRef<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = React.useCallback((waveSurfer: any) => {
    wavesurferRef.current = waveSurfer;
    if (wavesurferRef.current) {
      if (file) {
        wavesurferRef.current.load(file);
      }

      // wavesurferRef.current.on("region-created", regionCreatedHandler);

      wavesurferRef.current.on("ready", () => {
        setLoading(false);
      });

      wavesurferRef.current.on("loading", (n: number) => {
        setProgress(n);
      });

      // wavesurferRef.current.on("region-removed", (region) => {
      //   console.log("region-removed --> ", region);
      // });

      // wavesurferRef.current.on("loading", (data) => {
      //   console.log("loading --> ", data);
      // });
    }
  }, []);

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

  if (!file) return null;
  return (
    <div
      style={{ width: size === "small" ? "280px" : "360px", minHeight: 160 }}
    >
      <Grid container spacing={2} direction="column">
        <Grid item style={{ height: loading ? 0 : `initial` }}>
          <WaveSurfer plugins={plugins} onMount={handleMount}>
            <WaveForm
              id={"waveform-" + record.id}
              fillParent={true}
              mediaControls={true}
              height={size === "small" ? 64 : 128}
              // maxCanvasWidth={size === "small" ? 4000 : 6000}
            >
              <Region start={record.start_time} end={record.end_time} />
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
