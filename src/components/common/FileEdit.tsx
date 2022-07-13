/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box, Grid, Stack, Tab, Tabs } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import React, { useEffect } from "react";
import { FileField, FileInput } from "react-admin";

import AudioEdit from "./AudioPlayerField/AudioEdit";
import useFieldValue from "hooks/useFieldValue";
import { IAsset } from "types/asset";
import AudioRecorder from "./AudioRecorder";
import useBoolean from "hooks/useBoolean";
type FileType2 = {
  src: string;
};
export const FileEdit = (): JSX.Element => {
  const [value, setFile] = useFieldValue<string | FileType2 | null>(`file`);
  const handleDelete = () => setFile(null);

  const [mediaType] = useFieldValue<IAsset[`media_type`]>(`media_type`);

  useEffect(() => {
    const fileExt =
      typeof value == "string"
        ? value?.split(`.`)?.reverse()[0]
        : value?.src
        ? value?.src?.split(`.`)?.reverse()[0]
        : false;
    if (fileExt && !getFileExtensions(mediaType)?.some((f) => f == fileExt)) {
      setFile(null);
    }
  }, [mediaType]);

  const isUploadView = useBoolean();

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
                  size="large"
                >
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
                src={typeof value == "string" ? value : value?.src}
              />
            </>
          )}
        </Grid>
        <Grid item>
          {mediaType !== "audio" && !value && (
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

          {mediaType == "audio" && !value && (
            <>
              <Tabs
                value={isUploadView.value ? `upload` : `record`}
                onChange={(e, v) =>
                  v == "upload"
                    ? isUploadView.setTrue()
                    : isUploadView.setFalse()
                }
              >
                <Tab label="Upload" value="upload" />
                <Tab label="Record" value="record" />
              </Tabs>
              <>
                {isUploadView.value ? (
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
                ) : (
                  <Box position="relative">
                    <AudioRecorder
                      onFinish={(b) =>
                        setFile({
                          // @ts-ignore
                          rawFile: new File([b], "admin_recorded"),
                          // @ts-ignore
                          name: `admin-${Math.random()}`.split(`.`, ``),
                          src: URL.createObjectURL(b),
                        })
                      }
                    />
                  </Box>
                )}
              </>
            </>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export const getFileExtensions = (mediaType: string): string[] => {
  switch (mediaType) {
    case "audio":
      return [`mp3`, `wav`, `m4a`];
    case `photo`:
      return [`jpg`, `png`, `gif`];
    case `text`:
      return [`txt`];
    default:
      return [];
  }
};
