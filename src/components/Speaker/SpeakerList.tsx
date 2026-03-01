import { Edit } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CopyResourceButton from 'components/common/CopyResource';
import DeleteWithBinary from 'components/common/DeleteWithBinary';
import { useRoundwareDataProvider } from 'context/DataProviderContext';
import { useProjects } from 'context/ProjectsContext';
import { useSpeakers } from 'context/SpeakersContext';
import React from 'react';
import {
    BooleanField,
    BooleanInput,
    Datagrid,
    DateTimeInput,
    EditButton,
    List,
    TextField,
    TextInput,
    useListContext,
    useRecordContext,
} from 'react-admin';
import { ISpeaker } from 'types/speaker';
import SpeakerShapesControl from './SpeakerShapesControl';
const SpeakerList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const {
    fetchData,
    speakersWithoutShape,
    setSelectedSpeaker,
    selectedSpeaker,
  } = useSpeakers();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('xl'));
  if (!selectedProject) return <>No Project Selected.</>;
  return (
    <>
      <Box
        component={Paper}
        sx={{
          marginTop: '28px',
          display: 'flex',
          flexDirection: isWide ? 'row' : 'column',
        }}
      >
        <Box
          sx={{
            flex: isWide ? '1 1 50%' : '0 0 auto',
            overflowY: 'auto',
            overflowX: 'visible',
            width: isWide ? '50%' : '100%',
            height: isWide ? '80vh' : 'auto',
          }}
        >
          <Stack spacing={2}>
            {!!speakersWithoutShape.filter((s) => s.isNewlyCreated == false)
              .length && (
              <Alert severity='warning'>
                <AlertTitle>
                  There are some speakers with no shape assigned!
                </AlertTitle>
                Please assign a shape to following speakers:
                <Stack spacing={1} mt={1}>
                  {speakersWithoutShape
                    ?.filter((s) => s.isNewlyCreated == false)
                    .map((s) => (
                      <Stack
                        spacing={1}
                        direction={'row'}
                        key={s.id}
                        alignItems='center'
                      >
                        <Typography
                          textTransform={'uppercase'}
                          variant='subtitle2'
                        >
                          Speaker {s.id}: {s.code}
                        </Typography>
                        <Button
                          variant={
                            s.id == selectedSpeaker ? 'contained' : 'outlined'
                          }
                          size='small'
                          onClick={() =>
                            setSelectedSpeaker(
                              s.id == selectedSpeaker ? null : s.id
                            )
                          }
                          startIcon={<Edit />}
                        >
                          {selectedSpeaker == s.id
                            ? 'Ready to Draw'
                            : 'Click to Draw'}
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              </Alert>
            )}

            {!!speakersWithoutShape.filter((s) => s.isNewlyCreated == true)
              .length && (
              <Alert severity='info'>
                <AlertTitle>
                  Finish creating your new speakers by adding a shape on the
                  map.
                </AlertTitle>
                <Stack spacing={1} mt={1}>
                  {speakersWithoutShape
                    ?.filter((s) => s.isNewlyCreated == true)
                    .map((s) => (
                      <Stack
                        spacing={1}
                        direction={'row'}
                        key={s.id}
                        alignItems='center'
                      >
                        <Typography
                          textTransform={'uppercase'}
                          variant='subtitle2'
                        >
                          Speaker {s.id}: {s.code}
                        </Typography>
                        <Button
                          variant={
                            s.id == selectedSpeaker ? 'contained' : 'outlined'
                          }
                          size='small'
                          onClick={() =>
                            setSelectedSpeaker(
                              s.id == selectedSpeaker ? null : s.id
                            )
                          }
                          startIcon={<Edit />}
                        >
                          {s.id == selectedSpeaker
                            ? `Ready to Draw`
                            : `Click to Draw`}
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              </Alert>
            )}
          </Stack>
          <List 
            title='Speakers' 
            component='div'
            filters={[
              <TextInput
                key="contains_code"
                label="Speaker Code"
                source="contains_code"
              />,
              <DateTimeInput
                key="created_after"
                label="Created After"
                source="created__gte"
              />,
              <DateTimeInput
                key="created_before"
                label="Created Before"
                source="created__lte"
              />,
              <DateTimeInput
                key="updated_after"
                label="Updated After"
                source="updated__gte"
              />,
              <DateTimeInput
                key="updated_before"
                label="Updated Before"
                source="updated__lte"
              />,
              <BooleanInput
                key="activeyn"
                source="activeyn"
                label="Active"
                defaultValue={true}
              />,
            ]}
          >
            <FilteredDataSync />
            <Datagrid
              bulkActionButtons={<DeleteWithBinary isBulk />}
              style={{ flexShrink: 1 }}
              rowClick={false}
            >
              <SpeakerHighter />
              <SpeakerAudioPlayer />

              <TextField source='id' />
              <BooleanField source='activeyn' label='Active' />
              <TextField source='code' />

              {/* <TextField source="backupuri" />
      <TextField source="shape.type" />
      <TextField source="boundary.type" /> */}

              <EditButton label='' style={{ margin: 0 }} />
              <CopyResourceButton onSuccess={() => fetchData()} />
              <DeleteWithBinary />
            </Datagrid>
          </List>
        </Box>
        <Box
          sx={{
            flex: isWide ? '1 1 50%' : '0 0 auto',
            width: isWide ? '50%' : '100%',
            height: isWide ? 'auto' : '600px',
          }}
        >
          <SpeakerShapesControl />
        </Box>
      </Box>
    </>
  );
};

// Component to sync filtered data with SpeakersContext
const FilteredDataSync = () => {
  const { data: filteredSpeakers, filterValues } = useListContext();
  const { setSpeakers } = useSpeakers();
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  
  // Fetch ALL filtered speakers (not just current page) whenever filters change
  React.useEffect(() => {
    if (!selectedProject) return;
    
    const fetchAllFilteredSpeakers = async () => {
      try {
        const result = await dataProvider.getList('speakers', {
          pagination: { page: 1, perPage: 0 }, // Get all results
          sort: { field: 'id', order: 'ASC' },
          filter: {
            project_id: selectedProject.id,
            ...filterValues, // Include all current filter values
          },
        });
        setSpeakers(result.data as ISpeaker[]);
      } catch (error) {
        console.error('Error fetching filtered speakers:', error);
      }
    };
    
    fetchAllFilteredSpeakers();
  }, [filterValues, selectedProject, dataProvider, setSpeakers]);
  
  return null; // This component doesn't render anything
};

const SpeakerHighter = () => {
  const { id } = useRecordContext();
  const { setSelectedSpeaker, selectedSpeaker } = useSpeakers();

  const isSelected = id == selectedSpeaker;
  return (
    <Tooltip title={isSelected ? 'Unselect' : `Select On Map`} placement='left'>
      <IconButton
        onClick={() => setSelectedSpeaker(isSelected ? null : Number(id))}
        size='large'
      >
        {isSelected ? <LocationOnIcon /> : <LocationOnOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};

const SpeakerAudioPlayer = () => {
  const record = useRecordContext();
  const [playing, setPlaying] = React.useState(false);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
  }, [record?.id]); // Stop audio when switching speakers

  React.useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (!record?.uri) return;

    if (playing && audio) {
      audio.pause();
      setPlaying(false);
    } else {
      // Stop any currently playing audio
      if (audio) {
        audio.pause();
        audio.remove();
      }

      const newAudio = new Audio(record.uri);
      
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

  if (!record?.uri) {
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

export default SpeakerList;
