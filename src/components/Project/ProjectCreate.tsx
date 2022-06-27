import { Grid } from "@mui/material";
import CardBox from "components/common/CardBox";
import FormToolbar from "components/common/FormToolbar";
import LocationSelector from "components/common/LocationSelector";
import TranslatableField from "components/common/TranslatableField";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { IProject, useProjects } from "context/ProjectsContext";
import React from "react";
import {
  BooleanInput,
  Create,
  DateTimeInput,
  NumberInput,
  RaRecord,
  ReferenceArrayInput,
  required,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  TextInput,
  useRedirect,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import { handleLocalizedStrings } from "utils";
const ProjectCreate = (): JSX.Element => {
  const dataProvider = useRoundwareDataProvider();
  const redirect = useRedirect();
  const transform = async (r: RaRecord) => {
    const data = { ...r };

    const fields = [
      `sharing_message_loc`,
      `out_of_range_message_loc`,
      `legal_agreement_loc`,
      `demo_stream_message_loc`,
      `description_loc`,
    ];

    const promises = fields.map((f) =>
      handleLocalizedStrings(data[f + "_admin"], dataProvider).then(
        (ids) => (data[f] = ids)
      )
    );

    await Promise.all(promises);
    return data;
  };
  const pc = useProjects();
  const navigate = useNavigate();
  return (
    <Create
      title="Create a new project"
      mutationOptions={{
        onSuccess: (data: IProject) => {
          pc.refetch().then(() => pc.selectProject(data));
          navigate(`/project/${data.id}`);
        },
      }}
      transform={transform}
    >
      <SimpleForm warnWhenUnsavedChanges toolbar={<FormToolbar />}>
        <CardBox title="Project Config">
          <TextInput
            source="name"
            label="Project Name"
            fullWidth
            // validate={required()}
            required
          />
          <ReferenceArrayInput
            source="language_ids"
            reference="languages"
            label="Languages"
            validate={required()}
            fullWidth
            helperText="Projects can have multiple Languages assigned to them"
          >
            <SelectArrayInput optionText="name" />
          </ReferenceArrayInput>
          <TranslatableField
            label="Description"
            fromProject
            source="description_loc_admin"
          />
          {/* <NumberInput source="latitude" validate={required()} /> */}
          {/* <NumberInput source="longitude" validate={required()} /> */}
          <LocationSelector
            fieldNames={{
              latitude: "latitude",
              longitude: "longitude",
            }}
          />
          <DateTimeInput
            source="pub_date"
            defaultValue={new Date()}
            style={{ marginBottom: 0 }}
            // format={dateFormatter}
            label="Publish Date"
            required
            fullWidth
          />

          <BooleanInput source="listen_questions_dynamic" fullWidth />
          <BooleanInput source="speak_questions_dynamic" fullWidth />
        </CardBox>

        <CardBox title="Modes">
          <BooleanInput source="listen_enabled" defaultChecked />
          <BooleanInput source="speak_enabled" defaultChecked />
          <BooleanInput source="geo_listen_enabled" defaultChecked />
          <BooleanInput source="geo_speak_enabled" defaultChecked />
        </CardBox>

        <CardBox title="Asset Settings">
          <BooleanInput source="auto_submit" />
          <SelectInput
            source="ordering"
            validate={required()}
            choices={[
              { id: "by_like", name: "By Likes" },
              { id: "by_weight", name: "By Weight" },
              { id: "random", name: "Random" },
            ]}
          />
          <SelectInput
            source="repeat_mode"
            validate={required()}
            choices={[
              { id: "stop", name: "stop" },
              { id: "continuous", name: "continuous" },
            ]}
            fullWidth
          />
          <BooleanInput source="reset_tag_defaults_on_startup" />
          <BooleanInput source="timed_asset_priority" />
        </CardBox>

        <CardBox title="Recording Settings">
          <NumberInput
            source="recording_radius"
            required
            fullWidth
            helperText="Radius in meters of active range each Asset"
          />
          <NumberInput
            source="max_recording_length"
            validate={required()}
            fullWidth
            helperText="Max time users can speak"
          />
          <TextInput
            source="audio_format"
            defaultValue="mp3"
            validate={required()}
            fullWidth
            style={{ visibility: "hidden", position: "absolute" }}
          />

          <SelectInput
            source="audio_stream_bitrate"
            validate={required()}
            fullWidth
            defaultValue={"128"}
            choices={[
              { id: "64", name: "64" },
              { id: "96", name: "96" },
              { id: "112", name: "112" },
              { id: "128", name: "128" },
              { id: "160", name: "160" },
              { id: "192", name: "192" },
              { id: "256", name: "256" },
              { id: "320", name: "320" },
            ]}
            style={{ visibility: "hidden", position: "absolute" }}
          />
        </CardBox>
        <TranslatableField
          source="legal_agreement_loc_admin"
          fromProject
          label="Legal Agreement"
        />
        <Grid container spacing={2} style={{ width: "100%" }}>
          <Grid item xs={12} md={6}>
            <CardBox title="Sharing">
              <TextInput
                source="sharing_url"
                fullWidth
                validate={required()}
                helperText="URL of web sharing page"
              />
              <TranslatableField
                source="sharing_message_loc_admin"
                fromProject
                label="Sharing Message"
              />
            </CardBox>
          </Grid>
          <Grid item xs={12} md={6}>
            <CardBox title="Out of Range">
              <NumberInput
                source="out_of_range_distance"
                required
                fullWidth
                helperText="Distance in meters outside of Project Speaker ranges beyond which listener is considered out of range"
              />
              <TextInput
                source="out_of_range_url"
                fullWidth
                validate={required()}
                helperText="Default static stream that plays when listener is out of range upon opening client"
              />
              <TranslatableField
                source="out_of_range_message_loc_admin"
                fromProject
                label="Out Of Range Message"
              />
            </CardBox>
          </Grid>
        </Grid>

        <CardBox title="Demo Stream">
          <BooleanInput source="demo_stream_enabled" />
          <TextInput source="demo_stream_url" fullWidth />
          <TranslatableField
            source="demo_stream_message_loc_admin"
            fromProject
            label="Demo Stream Message"
          />
        </CardBox>
      </SimpleForm>
    </Create>
  );
};

export default ProjectCreate;
