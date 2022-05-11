import { Grid } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import React, { useEffect } from "react";
import { FileField, FileInput } from "react-admin";
import { useField } from "react-final-form";
import AudioEdit from "./AudioPlayerField/AudioEdit";
export const FileEdit = (): JSX.Element => {
  const {
    input: { onChange, value },
  } = useField(`file`);
  const handleDelete = () => onChange({ target: { value: null } });

  const {
    input: { value: mediaType },
  } = useField(`media_type`);

  useEffect(() => {
    const fileExt =
      typeof value == "string"
        ? value?.split(`.`)?.reverse()[0]
        : value?.src
        ? value?.src?.split(`.`)?.reverse()[0]
        : false;
    if (fileExt && !getFileExtensions(mediaType)?.some((f) => f == fileExt)) {
      onChange(null);
    }
  }, [mediaType]);

  return (
    <div style={{ width: "100%", marginBottom: 16 }}>
      <Grid container direction="column">
        <Grid item style={{ marginRight: 16 }}>
          {mediaType === "audio" && value && (
            <AudioEdit
              size="medium"
              buttons={[
                <IconButton
                  key="del"
                  style={{ color: "#dc004e" }}
                  onClick={handleDelete}
                  size="large">
                  <DeleteIcon />
                </IconButton>,
              ]}
            />
          )}

          {mediaType === "photo" && value && (
            <>
              <img
                alt="Not selected"
                height="300px"
                width="300px"
                style={{ objectFit: "contain" }}
                src={value?.src ? value.src : value}
              />
            </>
          )}
        </Grid>
        <Grid item>
          {(mediaType !== "audio" || !value) && (
            <FileInput
              source="file"
              multiple={false}
              label={`Upload ${getFileExtensions(mediaType).reduce(
                (acc, el) => (acc += el + ", "),
                ""
              )}`}
              accept={getFileExtensions(mediaType).reduce(
                (acc, el) => (acc += acc + ",." + el),
                ""
              )}
            >
              <FileField source="src" title="title" fullWidth />
            </FileInput>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export const getFileExtensions = (mediaType: string): string[] => {
  switch (mediaType) {
    case "audio":
      return [`mp3`, `wav`];
    case `photo`:
      return [`jpg`, `png`, `gif`];
    case `text`:
      return [`txt`];
    default:
      return [];
  }
};
