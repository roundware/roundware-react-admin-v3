/* eslint-disable @typescript-eslint/ban-ts-comment */
import Divider from "@material-ui/core/Divider";
import EnvelopeIdSelector from "components/common/EnvelopeIdSelector";
import LocationSelector from "components/common/LocationSelector";
import React from "react";
import {
  BooleanInput,
  DateTimeInput,
  Edit,
  EditProps,
  NumberInput,
  ReferenceArrayInput,
  ReferenceInput,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  TextInput,
} from "react-admin";
import { IAsset } from "../../types/asset";
import AudioOptions from "../common/AudioOptions";

const AssetEdit = (props: EditProps): JSX.Element => {
  const transform = async (data: Partial<IAsset>) => {
    if (!data.file) {
      // wants to remove file
      data.file = null;
    } else if (typeof data.file === "string") {
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
    console.log(data);
    return data;
  };
  return (
    <Edit
      title="Edit an asset"
      {...props}
      // @ts-ignore
      transform={transform}
    >
      <SimpleForm redirect={false}>
        <TextInput source="id" disabled fullWidth />
        <ReferenceInput
          label="Project"
          source="project_id"
          reference="projects"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>

        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            // { id: "video", name: "video" },
          ]}
          fullWidth
        />

        <AudioOptions />
        <LocationSelector
          fieldNames={{
            latitude: `latitude`,
            longitude: `longitude`,
          }}
        />
        <TextInput source="start_time" fullWidth />
        <TextInput source="end_time" fullWidth />
        <NumberInput source="session_id" fullWidth />
        <ReferenceInput label="User" source="user.id" reference="users">
          <SelectInput source="user.username" fullWidth />
        </ReferenceInput>
        <TextInput multiline source="description" fullWidth />
        <NumberInput source="latitude" fullWidth />
        <NumberInput source="longitude" fullWidth />
        <DateTimeInput source="created" fullWidth />
        <DateTimeInput source="updated" fullWidth />
        <BooleanInput source="submitted" fullWidth />
        <NumberInput source="volume" fullWidth />
        <NumberInput source="weight" fullWidth />
        <NumberInput source="start_time" fullWidth />
        <NumberInput source="end_time" fullWidth />
        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>
        <ReferenceArrayInput source="tag_ids" reference="tags" fullWidth>
          <SelectArrayInput optionText="description" fullWidth />
        </ReferenceArrayInput>

        <NumberInput
          label="Audio Length(s)"
          source="audio_length_in_seconds"
          fullWidth
        />
        <Divider />
        <ReferenceArrayInput
          source="description_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" fullWidth />
        </ReferenceArrayInput>
        <ReferenceArrayInput
          source="alt_text_loc_ids"
          reference="localizedstrings"
          fullWidth
        >
          <SelectArrayInput optionText="text" fullWidth />
        </ReferenceArrayInput>
        <EnvelopeIdSelector />
      </SimpleForm>
    </Edit>
  );
};

export default AssetEdit;
