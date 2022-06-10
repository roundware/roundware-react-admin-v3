import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { WaveSurfer, WaveForm, Region } from "wavesurfer-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import { useRecordContext, RaRecord } from "react-admin";
import { IconButton, Grid, LinearProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import useFieldValue from "hooks/useFieldValue";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
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
  const { file, ...record } =
    hooks[inEditView ? `useEditContext` : `useRecordContext`](props);

  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);

  const wavesurferRef = React.useRef<WaveSurfer>();

  const handleMount = React.useCallback(
    (waveSurfer: WaveSurfer) => {
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        if (file) {
          wavesurferRef.current.load(file);
        }

        wavesurferRef.current.on("ready", () => {
          setLoading(false);
        });

        wavesurferRef.current.on("loading", (n: number) => {
          setProgress(n);
        });
      }
    },
    [file]
  );

  const [playing, setPlaying] = useState(false);
  const handlePlay = () => {
    if (!wavesurferRef.current) return;
    if (playing) {
      setPlaying(false);
      return wavesurferRef.current?.pause();
    }
    const region = Object.values(wavesurferRef.current?.regions.list || {})[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    region.play();
    setPlaying(true);
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
              <Region
                start={record?.start_time}
                end={record?.end_time}
                drag={false}
                resize={false}
              />
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
