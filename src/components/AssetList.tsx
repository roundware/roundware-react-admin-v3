import React from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  ReferenceArrayField,
  SingleFieldList,
  ChipField,
  EditButton,
  DeleteButton,
  ListProps
} from "react-admin";
import AudioPlayerField from "./AudioPlayerField";

const AssetList = (props: ListProps) => {
  return <List {...props} filter={{project_id: 1}}>
    <Datagrid>
      <TextField source="id" />
      <BooleanField source="submitted" />
      <DateField source="created" />
      <ReferenceField label="Project" source="project_id" reference="projects">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField label="User" source="user.id" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <NumberField source="latitude" options={{ maximumFractionDigits: 8 }} />
      <NumberField source="longitude" options={{ maximumFractionDigits: 8 }} />
      <AudioPlayerField source="file" label="Source"/>
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
}

export default AssetList;
