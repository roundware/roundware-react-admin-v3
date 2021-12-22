import TagIdSelector from "components/common/TagIdSelector";
import React from "react";
import {
  BooleanField,
  ChipField,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  EditButton,
  FieldProps,
  List,
  ListProps,
  NumberField,
  ReferenceArrayField,
  SingleFieldList,
  TextField,
  useRecordContext,
  BooleanInput,
  NumberInput,
  SelectInput,
} from "react-admin";
import { useProjects } from "../../providers/ProjectsContext";
import AudioPlayerField from "../common/AudioPlayerField";

export const AssetList = (props: ListProps): JSX.Element => {
  const { selectedProject } = useProjects();
  return (
    <List
      {...props}
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
          label="Audio Length Greater Than Seconds"
          source="audio_length_in_seconds__gte"
        />,
        <NumberInput
          key="audiolengthlte"
          label="Audio Length Lesser Than Seconds"
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
    >
      <Datagrid optimized>
        <TextField source="id" />
        <BooleanField source="submitted" />
        <AssetPreview source="file" />
        <DateField source="created" />
        {/* <ReferenceField
          label="Project"
          source="project_id"
          reference="projects"
        >
          <TextField source="name" />
        </ReferenceField> */}
        {/* <ReferenceField label="User" source="user.id" reference="users">
          <TextField source="username" />
        </ReferenceField> */}
        <NumberField source="latitude" options={{ maximumFractionDigits: 8 }} />
        <NumberField
          source="longitude"
          options={{ maximumFractionDigits: 8 }}
        />
        {/* <AudioPlayerField source="file" label="Source" /> */}

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
        <EditButton basePath="/assets" />
        <DeleteButton basePath="/assets" />
      </Datagrid>
    </List>
  );
};

export default AssetList;

const AssetPreview = (props: FieldProps) => {
  const record = useRecordContext(props);

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
