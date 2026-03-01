/* eslint-disable @typescript-eslint/ban-ts-comment */
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import AudioOptions from 'components/common/AudioOptions';
import FileDownloadButton from 'components/common/FileDownloadButton';
import LocationSelector from 'components/common/LocationSelector';
import TagIdSelector from 'components/common/TagIdSelector';
import TranslatableField from 'components/common/TranslatableField';
import React, { useEffect, useState } from 'react';
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
    useRecordContext,
    useRedirect,
} from 'react-admin';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import { IAsset } from '../../types/asset';
import { buildLocalizationsPayload } from '../../utils';
import AssetShape, { shapeCache } from './AssetShape';

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

    // Shape is saved independently via the map controls — exclude from form PATCH
    delete (data as Record<string, unknown>).shape;

    // Ensure tag IDs are numbers
    if (Array.isArray(data.tag_ids)) {
      // @ts-ignore
      data.tag_ids = data.tag_ids.map(Number);
    }

    // Build inline localizations from _loc_admin fields
    const locPayload = buildLocalizationsPayload(
      data as Record<string, unknown>,
      { description_loc_admin: 'description' },
    );
    if (Object.keys(locPayload).length > 0) {
      (data as Record<string, unknown>).localizations = locPayload;
    }
    delete (data as Record<string, unknown>).description_loc_admin;

    return data;
  };

  return (
    <Edit
      title='Edit an asset'
      // @ts-ignore
      transform={transform}
      mutationMode='pessimistic'
      mutationOptions={{
        onSuccess: () => {
          redirect(`list`, `/assets`);
        },
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

        <AssetLocationWithShape />

        <NumberInput source='session_id' fullWidth />
        <ReferenceInput label='User' source='user_id' reference='users'>
          <AutocompleteInput
            optionText={(r) => `${r.first_name} ${r.last_name} (${r.email})`}
            label='User'
            fullWidth
            filterToQuery={(s) => ({ search_str: s })}
          />
        </ReferenceInput>

        <TextInput multiline source='description' fullWidth />
        <TranslatableField source='description_loc_admin' label='Localized Description' />

        <BooleanInput source='submitted' fullWidth />

        <ReferenceInput
          label='Language'
          source='language_id'
          reference='languages'
        >
          <SelectInput optionText='name' fullWidth />
        </ReferenceInput>

        <TagIdSelector source='tag_ids' multiple label='Tags' />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Inner component that has access to useRecordContext (inside SimpleForm).
 * Manages drawing-mode state shared between the header button and AssetShape.
 */
const AssetLocationWithShape = () => {
  const record = useRecordContext();
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Use module-level shapeCache (shared with AssetShape) so the button
  // state survives component remount and isn't polluted by stale record data.
  const [hasShape, setHasShape] = useState(() => {
    if (record?.id != null && shapeCache.has(record.id)) {
      return shapeCache.get(record.id) != null;
    }
    return !!record?.shape;
  });

  // Sync on record ID change (initial load / navigation)
  useEffect(() => {
    if (record?.id != null && shapeCache.has(record.id)) {
      setHasShape(shapeCache.get(record.id) != null);
    } else {
      setHasShape(!!record?.shape);
    }
  }, [record?.id]);  

  return (
    <LocationSelector
      fieldNames={{
        latitude: 'latitude',
        longitude: 'longitude',
      }}
      headerAction={
        !hasShape && !isDrawingMode ? (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsDrawingMode(true)}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Add Custom Shape
          </Button>
        ) : undefined
      }
    >
      <AssetShape
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
        onShapeChange={setHasShape}
      />
    </LocationSelector>
  );
};

export default AssetEdit;
