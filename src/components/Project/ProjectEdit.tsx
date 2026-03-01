import { Grid } from "@mui/material";
import CardBox from "components/common/CardBox";
import LocationSelector from "components/common/LocationSelector";
import TranslatableField from "components/common/TranslatableField";
import { useProjects } from "context/ProjectsContext";
import { useState } from "react";
import {
    BooleanInput,
    DateTimeInput,
    Edit,
    NumberInput,
    RaRecord,
    ReferenceArrayInput,
    required,
    SelectArrayInput,
    SelectInput,
    SimpleForm,
    TextInput,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import { buildLocalizationsPayload } from "../../utils.tsx";

const PROJECT_LOC_FIELD_MAP: Record<string, string> = {
  description_loc_admin: "description",
  sharing_message_loc_admin: "sharing_message",
  out_of_range_message_loc_admin: "out_of_range_message",
  legal_agreement_loc_admin: "legal_agreement",
  demo_stream_message_loc_admin: "demo_stream_message",
};

const ProjectEdit = (): JSX.Element => {
  const pc = useProjects();
  const transform = (r: RaRecord): RaRecord => {
    const data = { ...r };
    data.localizations = buildLocalizationsPayload(data, PROJECT_LOC_FIELD_MAP);
    // Clean up admin/legacy fields
    for (const key of Object.keys(PROJECT_LOC_FIELD_MAP)) {
      delete data[key];
      // Also remove legacy _loc (ID array) fields
      delete data[key.replace("_admin", "")];
    }
    return data;
  };
  const [warn, setWarn] = useState(true);
  const navigate = useNavigate();
  return (
    <Edit
      title="Edit a project"
      mutationMode="pessimistic"
      transform={transform}
      mutationOptions={{
        onSuccess: () => {
          setWarn(false);
          pc.refetch().then(() =>
            navigate(`/project/${pc.selectedProject?.id}`)
          );
        },
      }}
      queryOptions={{}}
    >
      <SimpleForm warnWhenUnsavedChanges={warn}>
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
            source="max_recording_length_sec"
            validate={required()}
            fullWidth
            helperText="Max time users can speak"
          />
          {/* audio_format and audio_stream_bitrate hidden — managed server-side */}
          <TextInput
            source="audio_format"
            defaultValue="mp3"
            sx={{ visibility: "hidden", position: "absolute" }}
          />
          <SelectInput
            source="audio_stream_bitrate"
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
            sx={{ visibility: "hidden", position: "absolute" }}
          />
        </CardBox>
        <TranslatableField
          source="legal_agreement_loc_admin"
          fromProject
          label="Legal Agreement"
        />
        <Grid container spacing={2} style={{ width: "100%" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardBox title="Sharing">
              <TextInput
                source="sharing_url"
                fullWidth
                helperText="URL of web sharing page"
              />
              <TranslatableField
                source="sharing_message_loc_admin"
                fromProject
                label="Sharing Message"
              />
            </CardBox>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
    </Edit>
  );
};

export default ProjectEdit;
