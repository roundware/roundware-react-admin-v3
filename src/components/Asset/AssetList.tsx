import CopyResourceButton from "components/common/CopyResource";
import ListActions from "components/common/ListActions";
import TagIdSelector from "components/common/TagIdSelector";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React from "react";
import {
  BooleanField,
  BooleanInput,
  ChipField,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  EditButton,
  List,
  NumberField,
  NumberInput,
  ReferenceArrayField,
  SelectInput,
  SingleFieldList,
  TextField,
  useDataProvider,
  useRecordContext,
} from "react-admin";
import { useProjects } from "../../providers/ProjectsContext";
import AudioPlayerField from "../common/AudioPlayerField";

export const AssetList = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  return (
    <List
      filter={{ project_id: selectedProject?.id }}
      filters={[
        <DateTimeInput
          key="after"
          label="Created After"
          source="created__gte"
        />,
        <DateTimeInput
          key="before"
          label="Created Before"
          source="created__lte"
        />,
        <NumberInput
          key="audiolengthgte"
          label="Audio Length Greater Than"
          source="audio_length_in_seconds__gte"
        />,
        <NumberInput
          key="audiolengthlte"
          label="Audio Length Lesser Than"
          source="audio_length_in_seconds__lte"
        />,
        <TagIdSelector
          multiple
          source="tag_ids"
          key="tag_ids"
          label="Includes Tags"
        />,
        <SelectInput
          source="media_type"
          key="media_type"
          label="Media Type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            // { id: "video", name: "video" },
          ]}
          fullWidth
        />,
        <BooleanInput key="submitted" source="submitted" label="Submitted" />,
      ]}
      perPage={30}
      sort={{
        field: "id",
        order: "DSC",
      }}
      actions={<ListActions />}
    >
      <Datagrid optimized>
        <TextField source="id" />
        <BooleanField source="submitted" />
        <AssetPreview />
        <DateField source="created" />
        <NumberField source="latitude" options={{ maximumFractionDigits: 8 }} />
        <NumberField
          source="longitude"
          options={{ maximumFractionDigits: 8 }}
        />

        <ReferenceArrayField label="Tags" reference="tags" source="tag_ids">
          <SingleFieldList>
            <ChipField source="msg_loc" />
          </SingleFieldList>
        </ReferenceArrayField>
        <NumberField
          label="Audio Length(s)"
          source="audio_length_in_seconds"
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
            a;
            return a;
          }}
        />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export default AssetList;

export const AssetPreview = () => {
  const record = useRecordContext();
  if (!record?.file) return <span>No File</span>;
  switch (record.media_type) {
    case "photo":
      return (
        <img
          width="100px"
          height="100px"
          style={{ objectFit: "contain" }}
          src={record?.file}
        />
      );
    case "audio":
      return <AudioPlayerField source="file" />;

    default:
      return <span>{record.media_type} not supported</span>;
  }
};
