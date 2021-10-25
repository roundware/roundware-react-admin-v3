import React, { useState } from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  ReferenceArrayInput,
  SelectArrayInput,
  DateTimeInput,
  FileInput,
  FileField,
  EditProps,
  useEditController,
  Record,
} from "react-admin";
import { useField } from "react-final-form";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import AudioEdit from "../AudioPlayerField/AudioEdit";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/styles/makeStyles";
import DeleteIcon from "@material-ui/icons/Delete";
import { IAsset } from "../../types";
import { FormLabel, Grid } from "@material-ui/core";
const AssetEdit = (props: EditProps) => {
  const { record } = useEditController(props);

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

        <FileEdit {...props} />

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
        <NumberInput source="envelope_ids" disabled fullWidth />
      </SimpleForm>
    </Edit>
  );
};

export default AssetEdit;

export const FileEdit = (props: EditProps) => {
  const {
    input: { onChange, value },
  } = useField(`file`);
  const handleDelete = () => onChange({ target: { value: null } });

  const {
    input: { value: mediaType },
  } = useField(`media_type`);

  return (
    <div style={{ width: "100%" }}>
      <FormLabel>File</FormLabel>
      <Grid container>
        <Grid item style={{ marginRight: 16 }}>
          {mediaType === "audio" && (
            <AudioEdit
              size="medium"
              buttons={[
                <IconButton style={{ color: "#dc004e" }} onClick={handleDelete}>
                  <DeleteIcon />
                </IconButton>,
              ]}
            />
          )}

          {mediaType === "photo" && (
            <>
              <img
                alt="No Photo selected"
                height="300px"
                width="300px"
                style={{ objectFit: "contain" }}
                src={value?.src ? value.src : value}
              />
            </>
          )}
        </Grid>
        <Grid item>
          <FileInput
            source="file"
            multiple={false}
            label={`Upload ${getFileExtensions(mediaType).reduce(
              (acc, el) => (acc += el + ","),
              ""
            )}`}
            accept={getFileExtensions(mediaType).reduce(
              (acc, el) => (acc += acc + "," + el),
              ""
            )}
          >
            <FileField source="src" title="title" fullWidth />
          </FileInput>
        </Grid>
      </Grid>
    </div>
  );
};

export const getFileExtensions = (mediaType: string) => {
  switch (mediaType) {
    case "audio":
      return [`.mp3`, `.wav`];
    case `photo`:
      return [`.jpg`, `.png`, `.gif`];
    case `text`:
      return [`.txt`];
    default:
      return [];
      break;
  }
};
