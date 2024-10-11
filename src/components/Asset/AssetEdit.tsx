/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import AudioOptions from 'components/common/AudioOptions';
import EnvelopeIdSelector from 'components/common/EnvelopeIdSelector';
import FileDownloadButton from 'components/common/FileDownloadButton';
import LocationSelector from 'components/common/LocationSelector';
import TagIdSelector from 'components/common/TagIdSelector';
import TranslatableField from 'components/common/TranslatableField';
import React from 'react';
import {
  AutocompleteInput,
  BooleanInput,
  DateTimeInput,
  Edit,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  useDataProvider,
  useRedirect,
} from 'react-admin';
import { handleLocalizedStrings } from 'utils';
import { IAsset } from '../../types/asset';
import AssetShape from './AssetShape';

const AssetEdit = (): JSX.Element => {
  const redirect = useRedirect();

  const dataProvider = useDataProvider();

  const transform = async (data: Partial<IAsset>) => {
    if (!data.file) {
      // wants to remove file
      data.file = null;
    } else if (typeof data.file === 'string') {
      // not edited; no need to include in PATCH request;
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
    if (data?.user) {
      data.user_id = data?.user?.id;
      delete data.user;
    }

    if (Number(data.envelope_ids) > 0) {
      // this means user wants to specify an existing envelope_ids
      // note though its plural, it doesn't want an array format
      data.envelope_ids = [Number(data.envelope_ids)];
    } else {
      // we need to create a new envelope here; and pass that id
      // using session_id = 1 for admin

      const res = await dataProvider.create(`envelopes`, {
        data: {
          session_id: 1,
        },
      });
      data.envelope_ids = [Number(res.data.id)];
    }

    if (data.loc_description_admin?.length)
      data.description_loc_ids = await handleLocalizedStrings(
        data.loc_description_admin,
        dataProvider
      );

    if (data.loc_alt_text_admin?.length)
      data.alt_text_loc_ids = await handleLocalizedStrings(
        data.loc_alt_text_admin,
        dataProvider
      );

    if (data.file) {
      // @ts-ignore
      data.tag_ids = data.tag_ids?.map(Number);

      data.alt_text_loc_ids = ((data.alt_text_loc_ids as number[]) ?? []).map(
        Number
      );
      data.description_loc_ids = (
        (data.description_loc_ids as number[]) ?? []
      ).map(Number);
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
        <TextInput source='id' disabled fullWidth />
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
            // { id: "video", name: "video" },
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
        <ReferenceInput label='User' source='user.id' reference='users'>
          <AutocompleteInput
            optionText={(r) =>
              `${r.first_name} ${r.last_name} (@${r.username})`
            }
            label='User'
            fullWidth
            filterToQuery={(s) => ({
              search_str: s,
            })}
          />
        </ReferenceInput>

        <TextInput multiline source='description' fullWidth />
        <DateTimeInput source='created' fullWidth />
        <DateTimeInput source='updated' fullWidth />
        <BooleanInput source='submitted' fullWidth />
        <ReferenceInput
          label='Language'
          source='language_id'
          reference='languages'
        >
          <SelectInput optionText='name' fullWidth />
        </ReferenceInput>
        <TagIdSelector source='tag_ids' multiple label='Tags' />
        <TranslatableField
          source='loc_description_admin'
          label='Description Localized'
        />

        <TranslatableField source='loc_alt_text_admin' label='Alt Text' />

        <EnvelopeIdSelector />
      </SimpleForm>
    </Edit>
  );
};

export default AssetEdit;
