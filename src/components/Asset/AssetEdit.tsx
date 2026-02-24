/* eslint-disable @typescript-eslint/ban-ts-comment */
import AudioOptions from 'components/common/AudioOptions';
import FileDownloadButton from 'components/common/FileDownloadButton';
import LocationSelector from 'components/common/LocationSelector';
import TagIdSelector from 'components/common/TagIdSelector';
import React from 'react';
import {
  AutocompleteInput,
  BooleanInput,
  DateField,
  Edit,
  Labeled,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useRedirect,
} from 'react-admin';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import { IAsset } from '../../types/asset';
import AssetShape from './AssetShape';

const AssetEdit = (): JSX.Element => {
  const redirect = useRedirect();

  const transform = async (data: Partial<IAsset>) => {
    const id = data.id;

    // File uploads can't go through JSON PATCH — use the dedicated endpoint
    // @ts-ignore
    const rawFile = data.file?.rawFile ?? (data.file instanceof File ? data.file : null);
    if (rawFile instanceof File || rawFile instanceof Blob) {
      const formData = new FormData();
      formData.append('file', rawFile);
      try {
        await apiFetcher(`/assets/${id}/upload-audio/`, {
          method: 'POST',
          body: formData,
        });
      } catch (e) {
        console.error('Audio upload failed', e);
        throw new Error('Audio upload failed — asset metadata not saved.');
      }
    }
    // Remove file from PATCH body regardless (PATCH is JSON metadata only)
    delete data.file;

    // Ensure tag IDs are numbers
    if (Array.isArray(data.tag_ids)) {
      // @ts-ignore
      data.tag_ids = data.tag_ids.map(Number);
    }

    return data;
  };

  return (
    <Edit
      title='Edit an asset'
      // @ts-ignore
      transform={transform}
      mutationMode='pessimistic'
      mutationOptions={{
        onSuccess: () => redirect(`list`, `/assets`),
      }}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <Labeled label='ID'>
          <TextField source='id' />
        </Labeled>

        <Labeled label='Created' fullWidth>
          <DateField source='created_at' showTime />
        </Labeled>
        <Labeled label='Updated' fullWidth>
          <DateField source='updated_at' showTime />
        </Labeled>

        <ReferenceInput
          label='Project'
          source='project_id'
          reference='projects'
        >
          <SelectInput optionText='name' fullWidth />
        </ReferenceInput>

        <SelectInput
          source='media_type'
          choices={[
            { id: 'audio', name: 'audio' },
            { id: 'photo', name: 'photo' },
            { id: 'text', name: 'text' },
          ]}
          fullWidth
        />

        {/* AudioOptions renders file picker + start/end/duration + volume + weight */}
        <AudioOptions />
        <FileDownloadButton source='file' />

        <LocationSelector
          fieldNames={{
            latitude: `latitude`,
            longitude: `longitude`,
          }}
        >
          <AssetShape />
        </LocationSelector>

        <NumberInput source='session_id' fullWidth />

        <ReferenceInput label='User' source='user_id' reference='users'>
          <AutocompleteInput
            optionText={(r) => `${r.full_name} (${r.email})`}
            label='User'
            fullWidth
            filterToQuery={(s) => ({ search_str: s })}
          />
        </ReferenceInput>

        <TextInput multiline source='description' fullWidth />

        <BooleanInput source='submitted' fullWidth />

        <ReferenceInput
          label='Language'
          source='language_id'
          reference='languages'
        >
          <SelectInput optionText='name' fullWidth />
        </ReferenceInput>

        <TagIdSelector source='tag_ids' multiple label='Tags' />

        <NumberInput source='envelope_id' label='Envelope ID' fullWidth />
      </SimpleForm>
    </Edit>
  );
};

export default AssetEdit;
