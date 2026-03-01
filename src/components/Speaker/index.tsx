import { LinearProgress, Stack, Typography } from '@mui/material';
import ColorPicker from 'components/common/ColorPicker';
import DualListReferenceInput from 'components/common/DualListReferenceInput';
import FileDownloadButton from 'components/common/FileDownloadButton';
import FormToolbar from 'components/common/FormToolbar';
import { useProjects } from 'context/ProjectsContext';
import { useSpeakers } from 'context/SpeakersContext';
import useBoolean from 'hooks/useBoolean';
import { useRef, useState } from 'react';
import {
    BooleanInput,
    Create,
    DateTimeInput,
    Edit,
    maxLength,
    NumberInput,
    RaRecord,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    SimpleFormProps,
    TextInput,
    useCreate,
    useNotify,
    useRefresh,
    useUpdate,
} from 'react-admin';
import { Navigate } from 'react-router-dom';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import SpeakerAudioControls from './SpeakerAudioControls';
import VariantAudioControls from './VariantAudioControls';

// Validation function for hex colors
const validateHexColor = (value: string) => {
  if (!value) return undefined;
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  if (!hexPattern.test(value)) {
    return 'Invalid hex color format. Use 6 or 8 character hex (e.g., #0000FF or #0000FF80)';
  }
  return undefined;
};

export const SpeakerEdit = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData } = useSpeakers();

  // Capture the raw file and set_as before transform strips them
  const pendingFileRef = useRef<File | Blob | null>(null);
  const pendingSetAsRef = useRef<string>("uri");

  const extractRawFile = (data: RaRecord) => {
    if (data?.file?.rawFile instanceof File || data?.file?.rawFile instanceof Blob) {
      pendingFileRef.current = data.file.rawFile;
    } else {
      pendingFileRef.current = null;
    }
    pendingSetAsRef.current = data?.set_as || "uri";
  };

  const transform = (data: RaRecord) => {
    extractRawFile(data);
    data.project_id = selectedProject?.id;
    // Always strip file from JSON body — upload goes via separate endpoint
    delete data.file;
    delete data.uri;
    delete data.backup_uri;
    delete data.set_as;

    delete data.shape;
    delete data.attenuation_border;
    delete data.boundary;

    return data;
  };

  const refresh = useRefresh();
  const notify = useNotify();

  const [progress, setProgress] = useState(0);
  const [update] = useUpdate();

  const success = useBoolean();
  const save: SimpleFormProps[`onSubmit`] = async (values: any) => {
    values = transform(values as RaRecord);
    try {
      await update(
        `speakers`,
        {
          data: values,
          previousData: values,
          id: values.id,
        },
        {
          returnPromise: true,
          mutationMode: 'pessimistic',
          onSuccess: async () => {
            // Upload audio file via dedicated endpoint if one was selected
            if (pendingFileRef.current) {
              setProgress(50);
              const formData = new FormData();
              formData.append('file', pendingFileRef.current);
              formData.append('set_as', pendingSetAsRef.current);
              try {
                await apiFetcher(`/speakers/${values.id}/upload-audio/`, {
                  method: 'POST',
                  body: formData,
                });
              } catch (e) {
                console.error('Speaker audio upload failed', e);
                notify('Audio upload failed', { type: 'warning' });
              }
              pendingFileRef.current = null;
            }
            fetchData();
            refresh();
            success.setTrue();
          },
        }
      );
    } catch (e) {
      notify(`Something went wrong!`, {
        type: 'error',
      });
    } finally {
      setProgress(0);
    }
  };

  if (success.value)
    return <Navigate to={`/project/${selectedProject?.id}/speakers`} />;
  return (
    <Edit transform={transform}>
      <SimpleForm
        reValidateMode='onBlur'
        warnWhenUnsavedChanges
        onSubmit={save}
      >
        <TextInput source='id' fullWidth />
        <BooleanInput source='activeyn' fullWidth />
        <TextInput source='code' fullWidth validate={maxLength(10)} />
        <SpeakerAudioControls />
        <FileDownloadButton source='uri' />
        <TextInput source='uri' fullWidth />
        <TextInput source='backup_uri' fullWidth />

        <VariantAudioControls />

        <NumberInput 
          source='attenuation_distance' 
          required 
          fullWidth 
          min={0}
          step={1}
          helperText="Meters (positive integers only)"
        />

        <ColorPicker
          source='fill_color'
          label='Fill Color'
          fullWidth
          helperText='6 or 8 character hex color (e.g., #0000FF80)'
          defaultValue='#0000FF80'
          validate={validateHexColor}
        />

        <ColorPicker
          source='border_color'
          label='Border Color'
          fullWidth
          helperText='6 or 8 character hex color (e.g., #0000FF)'
          defaultValue='#0000FF'
          validate={validateHexColor}
        />

        <ReferenceInput
          source='project_id'
          defaultValue={selectedProject?.id}
          reference='projects'
        >
          <SelectInput optionText='name' fullWidth />
        </ReferenceInput>

        <DualListReferenceInput
          reference='speakers'
          source='parents'
          label='Parents'
          optionText='code'
          filter={{ project_id: selectedProject?.id }}
        />

        {/* children */}
        <DualListReferenceInput
          reference='speakers'
          source='children'
          label='Children'
          optionText='code'
          filter={{ project_id: selectedProject?.id }}
        />

        <Stack spacing={2} sx={{ mt: 2 }}>
          <DateTimeInput source='created' fullWidth />
          <DateTimeInput source='updated' fullWidth />
        </Stack>

        {progress > 0 && (
          <Stack sx={{ width: '100%' }}>
            <Typography variant='subtitle2'>
              Upload Progress: {progress.toFixed(2)} %{' '}
            </Typography>
            <LinearProgress
              sx={{ width: '100%' }}
              variant={progress == 100 ? `indeterminate` : 'determinate'}
              value={parseFloat(progress.toFixed(2))}
            />
          </Stack>
        )}
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData, setSelectedSpeaker, addToNewlyCreatedSpeakers } =
    useSpeakers();
  // Capture the raw file and set_as before transform strips them
  const pendingFileRef = useRef<File | Blob | null>(null);
  const pendingSetAsRef = useRef<string>("uri");

  const extractRawFile = (data: RaRecord) => {
    if (data?.file?.rawFile instanceof File || data?.file?.rawFile instanceof Blob) {
      pendingFileRef.current = data.file.rawFile;
    } else {
      pendingFileRef.current = null;
    }
    pendingSetAsRef.current = data?.set_as || "uri";
  };

  const transform = (data: RaRecord) => {
    extractRawFile(data);
    data.project_id = selectedProject?.id;
    // Always strip file from JSON body — upload goes via separate endpoint
    delete data.file;
    delete data.set_as;
    return data;
  };

  const refresh = useRefresh();

  const [create] = useCreate();
  const [progress, setProgress] = useState(0);
  const notify = useNotify();
  const success = useBoolean();

  const save: SimpleFormProps[`onSubmit`] = async (values: any) => {
    values = transform(values as RaRecord);
    try {
      await create(
        `speakers`,
        {
          data: values,
        },
        {
          returnPromise: true,

          onSuccess: async (data) => {
            // Upload audio file via dedicated endpoint if one was selected
            if (pendingFileRef.current) {
              setProgress(50);
              const formData = new FormData();
              formData.append('file', pendingFileRef.current);
              formData.append('set_as', pendingSetAsRef.current);
              try {
                await apiFetcher(`/speakers/${data.id}/upload-audio/`, {
                  method: 'POST',
                  body: formData,
                });
              } catch (e) {
                console.error('Speaker audio upload failed', e);
                notify('Audio upload failed', { type: 'warning' });
              }
              pendingFileRef.current = null;
            }
            await fetchData();
            setSelectedSpeaker(parseInt(data.id.toString()));
            success.setTrue();
            refresh();
            addToNewlyCreatedSpeakers(data.id);
          },
        }
      );
    } catch (e) {
      notify(`Something went wrong!`, {
        type: 'error',
      });
    } finally {
      setProgress(0);
    }
  };

  if (success.value)
    return <Navigate to={`/project/${selectedProject?.id}/speakers`} />;
  return (
    <Create redirect={false} transform={transform}>
      <SimpleForm
        warnWhenUnsavedChanges
        onSubmit={save}
        toolbar={<FormToolbar />}
        reValidateMode='onBlur'
      >
        <BooleanInput source='activeyn' fullWidth defaultChecked />
        <TextInput source='code' validate={maxLength(10)} fullWidth required />

        <SpeakerAudioControls />
        <VariantAudioControls />
        <NumberInput
          source='attenuation_distance'
          fullWidth
          helperText='Meters'
        />

        <ColorPicker
          source='fill_color'
          label='Fill Color'
          fullWidth
          helperText='6 or 8 character hex color (e.g., #0000FF80)'
          defaultValue='#0000FF80'
          validate={validateHexColor}
        />

        <ColorPicker
          source='border_color'
          label='Border Color'
          fullWidth
          helperText='6 or 8 character hex color (e.g., #0000FF)'
          defaultValue='#0000FF'
          validate={validateHexColor}
        />

        <DualListReferenceInput
          reference='speakers'
          source='parents'
          label='Parents'
          optionText='code'
          filter={{ project_id: selectedProject?.id }}
        />

        <DualListReferenceInput
          reference='speakers'
          source='children'
          label='Children'
          optionText='code'
          filter={{ project_id: selectedProject?.id }}
        />

        <Stack spacing={2} sx={{ mt: 2 }}>
          <DateTimeInput source='created' fullWidth defaultValue={new Date()} />
          <DateTimeInput source='updated' fullWidth />
        </Stack>

        {progress > 0 && (
          <Stack sx={{ width: '100%' }}>
            <Typography variant='subtitle2'>
              {progress == 100
                ? `Processing...`
                : `Upload Progress: ${progress.toFixed(2)} %`}
            </Typography>
            <LinearProgress
              sx={{ width: '100%' }}
              variant={progress == 100 ? `indeterminate` : 'determinate'}
              value={parseFloat(progress.toFixed(2))}
            />
          </Stack>
        )}
      </SimpleForm>
    </Create>
  );
};
