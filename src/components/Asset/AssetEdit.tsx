/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
  NumberField,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useRedirect,
} from 'react-admin';
import { IAsset } from '../../types/asset';
import AssetShape from './AssetShape';

const AssetEdit = (): JSX.Element => {
  const redirect = useRedirect();

  const transform = async (data: Partial<IAsset>) => {
    if (!data.file) {
      // wants to remove file
      data.file = null;
    } else if (typeof data.file === 'string') {
      // not edited; no need to include in PATCH request
      delete data.file;
    } else {
      // pass the file blob
      // @ts-ignore
      if (data.file?.src) {
        // @ts-ignore
        data.file = data.file?.rawFile;
        // @ts-ignore
        data.filename = data.file?.name;
      }
    }

    // Convert tag_ids array to comma-separated string for multipart form
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
        <TextField source='id' />

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

        <DateField source='created_at' showTime label='Created' />
        <DateField source='updated_at' showTime label='Updated' />

        <NumberField
          source='audio_length_sec'
          label='Audio Length (s)'
          options={{ maximumFractionDigits: 3 }}
        />
        <NumberInput source='start_time' fullWidth />
        <NumberInput source='end_time' fullWidth />

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
