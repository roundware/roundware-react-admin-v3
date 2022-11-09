import { LinearProgress, Stack, Typography } from "@mui/material";
import FileDownloadButton from "components/common/FileDownloadButton";
import FormToolbar from "components/common/FormToolbar";
import { useProjects } from "context/ProjectsContext";
import { useSpeakers } from "context/SpeakersContext";
import useBoolean from "hooks/useBoolean";
import React, { useState } from "react";
import {
  BooleanInput,
  Create,
  Edit,
  maxLength,
  NumberInput,
  RaRecord,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SimpleFormProps,
  TextInput,
  useCreate,
  useNotify,
  useRefresh,
  useUpdate,
} from "react-admin";
import { Navigate } from "react-router-dom";
import SpeakerAudioControls from "./SpeakerAudioControls";

export const SpeakerEdit = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData } = useSpeakers();

  const transform = (data: RaRecord) => {
    data.project = selectedProject?.id;
    if (typeof data?.file?.src == "string") {
      data.file = data.file.rawFile;
      delete data.uri;
      delete data.backupuri;
    } else delete data?.file;
    delete data.shape;
    delete data.attenuation_border;
    delete data.boundary;

    return data;
  };

  const refresh = useRefresh();
  const notify = useNotify();

  const [progress, setProgress] = useState(0);
  const [update] = useUpdate();

  const success = useBoolean();
  const save: SimpleFormProps[`onSubmit`] = async (values) => {
    values = transform(values as RaRecord);
    try {
      await update(
        `speakers`,
        {
          data: values,
          previousData: values,
          id: values.id,
          meta: {
            onProgress: (ev: { loaded: number; total: number }) => {
              const newPercent = (ev.loaded / ev.total) * 100;
              setProgress((prev) => (prev > newPercent ? prev : newPercent));
            },
          },
        },
        {
          returnPromise: true,
          mutationMode: "pessimistic",
          onSuccess: () => {
            fetchData();
            refresh();
            success.setTrue();
          },
        }
      );
    } catch (e) {
      notify(`Something went wrong!`, {
        type: "error",
      });
    } finally {
      setProgress(0);
    }
  };

  if (success.value)
    return <Navigate to={`/project/${selectedProject?.id}/speakers`} />;
  return (
    <Edit transform={transform}>
      <SimpleForm
        reValidateMode="onBlur"
        warnWhenUnsavedChanges
        onSubmit={save}
      >
        <TextInput source="id" fullWidth />
        <BooleanInput source="activeyn" fullWidth />
        <TextInput source="code" fullWidth validate={maxLength(10)} />
        <SpeakerAudioControls />
        <FileDownloadButton source="uri" />
        <TextInput source="uri" fullWidth />
        <TextInput source="backupuri" fullWidth />

        <NumberInput source="attenuation_distance" required fullWidth />

        <ReferenceInput
          source="project_id"
          defaultValue={selectedProject?.id}
          reference="projects"
        >
          <SelectInput optionText="name" fullWidth />
        </ReferenceInput>

        {progress > 0 && (
          <Stack sx={{ width: "100%" }}>
            <Typography variant="subtitle2">
              Upload Progress: {progress.toFixed(2)} %{" "}
            </Typography>
            <LinearProgress
              sx={{ width: "100%" }}
              variant={progress == 100 ? `indeterminate` : "determinate"}
              value={parseFloat(progress.toFixed(2))}
            />
          </Stack>
        )}
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData, setSelectedSpeaker, addToNewlyCreatedSpeakers } =
    useSpeakers();
  const transform = (data: RaRecord) => {
    data.project = selectedProject?.id;
    if (typeof data?.file?.src == "string") {
      data.file = data.file.rawFile;
      delete data.uri;
      delete data.backupuri;
    } else delete data?.file;
    if (!data.minvolume) data.minvolume = 0.1;
    if (!data.maxvolume) data.maxvolume = 0.5;
    return data;
  };

  const refresh = useRefresh();

  const [create] = useCreate();
  const [progress, setProgress] = useState(0);
  const notify = useNotify();
  const success = useBoolean();

  const save: SimpleFormProps[`onSubmit`] = async (values) => {
    values = transform(values as RaRecord);
    try {
      await create(
        `speakers`,
        {
          data: values,
          meta: {
            onProgress: (ev: { loaded: number; total: number }) => {
              const newPercent = (ev.loaded / ev.total) * 100;
              setProgress((prev) => (prev > newPercent ? prev : newPercent));
            },
          },
        },
        {
          returnPromise: true,

          onSuccess: async (data) => {
            console.log(`success`);
            await fetchData();
            setSelectedSpeaker(parseInt(data.id.toString()));
            success.setTrue();
            refresh();
            addToNewlyCreatedSpeakers(data.id);
          },
        }
      );
    } catch (e) {
      notify(`Something went wrong!`, {
        type: "error",
      });
    } finally {
      setProgress(0);
    }
  };

  if (success.value)
    return <Navigate to={`/project/${selectedProject?.id}/speakers`} />;
  return (
    <Create redirect={false} transform={transform}>
      <SimpleForm
        warnWhenUnsavedChanges={!success.value}
        onSubmit={save}
        toolbar={<FormToolbar />}
        redirect="/speakers"
        reValidateMode="onBlur"
      >
        <BooleanInput source="activeyn" fullWidth defaultChecked />
        <TextInput source="code" validate={maxLength(10)} fullWidth required />

        <SpeakerAudioControls />
        <NumberInput
          source="attenuation_distance"
          fullWidth
          helperText="Meters"
        />
        {progress > 0 && (
          <Stack sx={{ width: "100%" }}>
            <Typography variant="subtitle2">
              {progress == 100
                ? `Processing...`
                : `Upload Progress: ${progress.toFixed(2)} %`}
            </Typography>
            <LinearProgress
              sx={{ width: "100%" }}
              variant={progress == 100 ? `indeterminate` : "determinate"}
              value={parseFloat(progress.toFixed(2))}
            />
          </Stack>
        )}
      </SimpleForm>
    </Create>
  );
};
