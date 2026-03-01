import CopyResourceButton from 'components/common/CopyResource';
import DeleteWithBinary from 'components/common/DeleteWithBinary';
import { FC, useLayoutEffect } from 'react';
import {
    BooleanField,
    ChipField,
    Datagrid,
    DateField,
    EditButton,
    FieldProps,
    NumberField,
    ReferenceArrayField,
    SingleFieldList,
    TextField,
    useListController,
    useRecordContext,
} from 'react-admin';
import AudioPlayerField from '../common/AudioPlayerField';
import TextDisplayField from './TextDisplayField';

const assetCopyTransform = (data: Record<string, unknown>) => {
  const { created_at, updated_at, file, file_key, ...rest } = data;
  return rest;
};

export const AssetDatagrid = (): JSX.Element => {
  const { setPerPage, refetch } = useListController();
  useLayoutEffect(() => {
    setPerPage(10);
    refetch();
  }, []);
  return (
    <div>
      <Datagrid optimized bulkActionButtons={<DeleteWithBinary isBulk />} rowClick={false}>
        <TextField source='id' />
        <BooleanField source='submitted' />

        <AssetPreview label='Media' />
        <DateField source='created_at' label='Created' />
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
          label='Audio Length (s)'
          source='audio_length_sec'
          options={{ maximumFractionDigits: 3 }}
        />
        <EditButton />
        <CopyResourceButton transform={assetCopyTransform} />
        <DeleteWithBinary />
      </Datagrid>
    </div>
  );
};

export default AssetDatagrid;

export const AssetPreview: FC<FieldProps> = () => {
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
