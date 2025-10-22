import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useRecordContext } from "react-admin";

interface VariantAudioPlayerProps {
  src?: string;
}

const VariantAudioPlayer = ({ src }: VariantAudioPlayerProps): JSX.Element => {
  const record = useRecordContext();
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Use src prop if provided, otherwise use record.uri or record (for array items)
  const audioSrc = src || record?.uri || record;

  useEffect(() => {
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
  }, [audioSrc]); // Stop audio when switching variants

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (!audioSrc) return;

    if (playing && audio) {
      audio.pause();
      setPlaying(false);
    } else {
      // Stop any currently playing audio
      if (audio) {
        audio.pause();
        audio.remove();
      }

      const newAudio = new Audio(audioSrc);
      
      // Set volume to maximum and other properties
      newAudio.volume = 1.0;
      newAudio.muted = false;
      newAudio.crossOrigin = 'anonymous';
      newAudio.preload = 'metadata';
      
      // Add event listeners
      newAudio.addEventListener('ended', () => {
        setPlaying(false);
      });
      
      newAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setPlaying(false);
      });
      
      // Load and play the audio
      newAudio.load();
      
      newAudio.play().then(() => {
        setAudio(newAudio);
        setPlaying(true);
      }).catch((error) => {
        console.error('Audio play failed:', error);
        setPlaying(false);
      });
    }
  };

  if (!audioSrc) {
    return (
      <Tooltip title="No audio file" placement="left">
        <IconButton disabled size="small">
          <PlayArrowIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={playing ? 'Pause' : 'Play'} placement="left">
      <IconButton onClick={handlePlayPause} size="small">
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default VariantAudioPlayer;



