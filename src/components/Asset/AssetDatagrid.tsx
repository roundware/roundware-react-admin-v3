import CopyResourceButton from 'components/common/CopyResource';
import { useRoundwareDataProvider } from 'context/DataProviderContext';
import React, { useLayoutEffect } from 'react';
import {
  BooleanField,
  ChipField,
  Datagrid,
  DateField,
  DeleteButton,
  EditButton,
  NumberField,
  RaRecord,
  ReferenceArrayField,
  SingleFieldList,
  TextField,
  useListController,
  useRecordContext,
} from 'react-admin';
import AudioPlayerField from '../common/AudioPlayerField';
import TextDisplayField from './TextDisplayField';

export const AssetDatagrid = (): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();

  const { setPerPage, refetch } = useListController();
  useLayoutEffect(() => {
    setPerPage(10);
    refetch();
  }, []);
  return (
    <div>
      <Datagrid optimized>
        <TextField source='id' />
        <BooleanField source='submitted' />
        <AssetPreview />
        <DateField source='created' />
        <NumberField source='latitude' options={{ maximumFractionDigits: 8 }} />
        <NumberField
          source='longitude'
          options={{ maximumFractionDigits: 8 }}
        />

        <ReferenceArrayField label='Tags' reference='tags' source='tag_ids'>
          <SingleFieldList>
            <ChipField source='value' />
          </SingleFieldList>
        </ReferenceArrayField>
        <NumberField
          label='Audio Length(s)'
          source='audio_length_in_seconds'
          options={{ maximumFractionDigits: 3 }}
        />
        <EditButton />
        <CopyResourceButton
          assignFirst={async () => {
            const res = await dataProvider.create(`envelopes`, {
              data: {
                session_id: 1,
              },
            });
            return { envelope_ids: Number(res.data.id) };
          }}
          transform={(a) => {
            if (Array.isArray(a.tag_ids)) a.tag_ids = a.tag_ids.join(`,`);
            a.session_id = 1;
            delete a.file;
            delete a.user;
            if (a.loc_description_admin?.length)
              a.description_loc_ids = a.loc_description_admin
                .map((r: RaRecord) => r.id)
                .reduce(
                  (acc: string, el: number) =>
                    acc.toString() + el.toString() + ',',
                  ''
                )
                .slice(0, -1);

            if (a.loc_alt_text_admin?.length)
              a.alt_text_loc_ids = a.loc_alt_text_admin
                .map((r: RaRecord) => r.id)
                .reduce(
                  (acc: string, el: number) =>
                    acc.toString() + el.toString() + ',',
                  ''
                )
                .slice(0, -1);
            delete a.loc_alt_text_admin;
            delete a.loc_description_admin;
            a.dummy = new Blob();
            return a;
          }}
        />
        <DeleteButton />
      </Datagrid>
    </div>
  );
};

export default AssetDatagrid;

export const AssetPreview = () => {
  const record = useRecordContext();
  if (!record?.file) return <span>No File</span>;
  switch (record.media_type) {
    case 'photo':
      return (
        <img
          width='100px'
          height='100px'
          style={{ objectFit: 'contain' }}
          src={record?.file}
        />
      );
    case 'audio':
      return <AudioPlayerField source='file' />;

    case 'text':
      return <TextDisplayField />;

    default:
      return <span>{record.media_type} not supported</span>;
  }
};
