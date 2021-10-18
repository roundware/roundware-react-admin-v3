import React, { useState } from "react";
import PropTypes from "prop-types";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
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
  source: string;
}

const AudioPlayerField = (props: PropTypes) => {
  const { source } = props;
  const { file, ...record } = useRecordContext(props);

  const wavesurferRef = React.useRef<any>();
  const handleMount = React.useCallback((waveSurfer: any) => {
    wavesurferRef.current = waveSurfer;
    if (wavesurferRef.current) {
      if (file) wavesurferRef.current.load(file);

      // wavesurferRef.current.on("region-created", regionCreatedHandler);

      wavesurferRef.current.on("ready", () => {
        console.log("WaveSurfer is ready");
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
    wavesurferRef.current.play();
    setPlaying(true);
  };

  if (!file) return null;
  return (
    <div style={{ width: "300px" }}>
      <Grid container spacing={2} direction="column">
        <Grid item>
          <WaveSurfer plugins={plugins} onMount={handleMount}>
            <WaveForm
              id={"waveform-" + record.id}
              fillParent={true}
              mediaControls={true}
            >
              <Region start={record.start_time} end={record.end_time} />
            </WaveForm>
          </WaveSurfer>
        </Grid>
        <Grid
          item
          justifyContent="center"
          alignItems="center"
          direction="column"
        >
          <IconButton onClick={handlePlay}>
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
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
