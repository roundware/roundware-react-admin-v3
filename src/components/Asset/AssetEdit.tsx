/* eslint-disable @typescript-eslint/ban-ts-comment */
import AddIcon from '@mui/icons-material/Add';
import { Box, Button } from '@mui/material';
import AudioOptions from 'components/common/AudioOptions';
import FileDownloadButton from 'components/common/FileDownloadButton';
import LocationSelector from 'components/common/LocationSelector';
import TagIdSelector from 'components/common/TagIdSelector';
import TranslatableField from 'components/common/TranslatableField';
import React, { useEffect, useState } from 'react';
import {
  DateTimeInput,
    AutocompleteInput,
    BooleanInput,
    DateField,
    Edit,
    Labeled,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SaveButton,
    SimpleForm,
    TextField,
    Toolbar,
    TextInput,
    useRecordContext,
    useRedirect,
} from 'react-admin';
import { apiFetcher } from 'roundwareDataProvider/tokenAuthProvider';
import { IAsset } from '../../types/asset';
import { buildLocalizationsPayload } from '../../utils';
import DeleteWithBinary from 'components/common/DeleteWithBinary';
import AssetBundleField from './AssetBundleField';
import AssetShape, { shapeCache } from './AssetShape';
import { AssetPathLine, AssetPathPanel } from './AssetPath';
import { ParticipantLink, useCanSeeParticipants } from '../../pages/Participants';

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

    // A moving asset's position is its mover's to set (server docs/030): the
    // form's copy is from when the page opened, and saving it would pull the
    // asset back. Its path is edited in the Path panel.
    if (data.moving) {
      delete (data as Record<string, unknown>).latitude;
      delete (data as Record<string, unknown>).longitude;
    }
    delete (data as Record<string, unknown>).moving;
    delete (data as Record<string, unknown>).path;

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
      <SimpleForm
        warnWhenUnsavedChanges
        // The stock toolbar's delete cannot offer to delete attachments, so
        // this uses the same dialog as the asset list.
        toolbar={
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <SaveButton />
            <DeleteWithBinary onDeleted={() => redirect('list', '/assets')} />
          </Toolbar>
        }
      >
        <Labeled label='ID'>
          <TextField source='id' />
        </Labeled>

        {/* When it was recorded (server docs/032): the listening site shows,
            filters and sorts by it. Cleared, it goes back to when it was added. */}
        <DateTimeInput
          source='recorded_at'
          label='Date recorded'
          helperText='Shown on the listening site. Empty: when it was added.'
          // The browser's local time, sent with its zone (without one the
          // server takes UTC).
          parse={(v: string) => (v ? new Date(v).toISOString() : null)}
        />
        <Labeled label='Added' fullWidth>
          <DateField source='created_at' showTime />
        </Labeled>
        <Labeled label='Updated' fullWidth>
          <DateField source='updated_at' showTime />
        </Labeled>
        <ContributorField />

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
        <AssetPathPanel />

        <NumberInput source='session_id' fullWidth />
        <ReferenceInput label='User' source='user_id' reference='users'>
          <AutocompleteInput
            optionText={(r) => `${r.first_name} ${r.last_name} (${r.email})`}
            label='User'
            fullWidth
            filterToQuery={(s) => ({ search_str: s })}
          />
        </ReferenceInput>

        <AssetBundleField />

        {/* A tab per language; the default language's is the description
            itself (server docs/017), which had its own input as well. */}
        <TranslatableField source='description_loc_admin' label='Description' multiline />

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
 * What the participant chose to give (server docs/023): kept on their
 * participant, so it shows with each of their contributions. Labeled like the
 * dates above it, and absent when they gave nothing.
 */
const ContributorField = () => {
  const r = useRecordContext<{ id: number; contributor_name?: string; contributor_email?: string | null; participant_id?: number | null }>();
  const can = useCanSeeParticipants();
  const contact = !!(r?.contributor_name || r?.contributor_email);
  if (!contact && !(can && r?.participant_id)) return null;
  return (
    // A Box, not a span: Labeled leaves out its label for plain elements.
    <Labeled label='Participant' fullWidth>
      <Box component='span' sx={{ fontSize: 14 }}>
        {r?.contributor_name}
        {r?.contributor_name && r?.contributor_email ? ' · ' : ''}
        {r?.contributor_email && <a href={`mailto:${r.contributor_email}`}>{r.contributor_email}</a>}
        {/* Who they are to Roundware, and everything else they did (owners, admins). */}
        {can && r?.participant_id ? (
          <>
            {contact ? ' · ' : ''}
            <ParticipantLink id={r.participant_id} />
          </>
        ) : null}
      </Box>
    </Labeled>
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
      // Remount when the asset stops/starts moving or is trimmed back: the
      // card keeps its own copy of the coordinates from when it mounted.
      key={`${record?.id}-${record?.moving}-${record?.latitude}-${record?.longitude}`}
      fieldNames={{
        latitude: 'latitude',
        longitude: 'longitude',
      }}
      readOnlyNote={
        record?.moving
          ? 'Set by its mover while it moves (as of when this page opened). To change it, stop moving below.'
          : undefined
      }
      headerAction={
        !hasShape && !isDrawingMode && !record?.moving ? (
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
      <AssetPathLine />
    </LocationSelector>
  );
};

export default AssetEdit;
