import React from "react";
import {
  BooleanInput,
  Create,
  CreateProps,
  Edit,
  EditProps,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  RaRecord,
  useRedirect,
  useRefresh,
} from "react-admin";
import { useProjects } from "providers/ProjectsContext";
import { useSpeakers } from "providers/SpeakersContext";
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

  const redirect = useRedirect();
  const refresh = useRefresh();
  return (
    <Edit
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          fetchData();
          refresh();
          redirect("list", `/speakers`);
        },
      }}
      transform={transform}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="id" fullWidth />
        <BooleanInput source="activeyn" fullWidth />
        <TextInput source="code" fullWidth />
        <SpeakerAudioControls />
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
      </SimpleForm>
    </Edit>
  );
};

export const SpeakerCreate = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const { fetchData, setSelectedSpeaker } = useSpeakers();
  const transform = (data: Record) => {
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

  const redirect = useRedirect();
  const refresh = useRefresh();
  return (
    <Create
      transform={transform}
      mutationOptions={{
        onSuccess: (data: RaRecord) => {
          fetchData();
          refresh();
          redirect(`list`, `/speakers`);
          setSelectedSpeaker(parseInt(data.id.toString()));
        },
      }}
    >
      <SimpleForm warnWhenUnsavedChanges>
        <BooleanInput source="activeyn" fullWidth defaultChecked />
        <TextInput source="code" fullWidth required />

        <SpeakerAudioControls />
        <NumberInput
          source="attenuation_distance"
          fullWidth
          helperText="Meters"
        />
      </SimpleForm>
    </Create>
  );
};
