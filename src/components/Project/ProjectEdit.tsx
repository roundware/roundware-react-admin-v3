import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import CardBox from "components/common/CardBox";
import LocationSelector from "components/common/LocationSelector";
import TranslatableField from "components/common/TranslatableField";
import { useProjects } from "context/ProjectsContext";
import { useState } from "react";
import {
    BooleanInput,
    Edit,
    NumberInput,
    RaRecord,
    ReferenceArrayInput,
    required,
    SaveButton,
    SelectArrayInput,
    SelectInput,
    SimpleForm,
    TextInput,
    Toolbar,
    usePermissions,
    useRecordContext,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import { buildLocalizationsPayload } from "../../utils";
import AdvancedConfigInput from "./AdvancedConfigInput";
import DeleteProjectDialog from "./DeleteProjectDialog";

const PROJECT_LOC_FIELD_MAP: Record<string, string> = {
  description_loc_admin: "description",
  sharing_message_loc_admin: "sharing_message",
  out_of_range_message_loc_admin: "out_of_range_message",
  legal_agreement_loc_admin: "legal_agreement",
  demo_stream_message_loc_admin: "demo_stream_message",
};

/**
 * Deleting the project, at the foot of its settings. It lived on the
 * project's Show page, reached by a "Show" button here; that page repeated
 * these settings read-only and is no longer linked (the projects list, the
 * other place to delete from, is for superusers only).
 */
const DeleteProjectSection = () => {
  const record = useRecordContext();
  const { permissions } = usePermissions();
  const [open, setOpen] = useState(false);
  const canDelete = ["superuser", "owner", "admin"].includes(permissions?.role);
  if (!record || !canDelete) return null;
  return (
    <Box sx={{ px: 2, pb: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" fontWeight={600}>
        Delete this project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Permanently deletes the project and everything in it. You'll see what
        will be removed, and confirm, before anything is deleted.
      </Typography>
      <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setOpen(true)}>
        Delete Project
      </Button>
      {open && (
        <DeleteProjectDialog
          open
          projects={[{ id: record.id as number, name: record.name as string }]}
          onClose={() => setOpen(false)}
          // The project is gone, and it was the selected one: start over on
          // the admin's home page, where another is chosen.
          onDeleted={() => window.location.assign("/")}
        />
      )}
    </Box>
  );
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
      // No Show button: the Show page only repeated these settings read-only.
      actions={false}
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
      <SimpleForm
        warnWhenUnsavedChanges={warn}
        // Save only: deleting is the section below, whose dialog says what
        // goes with the project. The stock toolbar's Delete skipped that.
        toolbar={
          <Toolbar>
            <SaveButton />
          </Toolbar>
        }
      >
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
          >
            <SelectArrayInput
              optionText="name"
              fullWidth
              helperText="Projects can have multiple Languages assigned to them"
            />
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
          <BooleanInput source="listen_questions_dynamic" fullWidth />
          <BooleanInput source="speak_questions_dynamic" fullWidth />
        </CardBox>

        <CardBox title="Modes">
          <BooleanInput
            source="allow_speak_tags"
            helperText="Whether contributors are ASKED to tag their upload. Default speak tags are applied either way, and a project with no Speak groups skips the step automatically — so turn this off only to tag silently without asking."
          />
          <BooleanInput source="allow_photos" />
          <BooleanInput source="allow_text" />
          <BooleanInput source="listen_enabled" defaultChecked />
          <BooleanInput source="speak_enabled" defaultChecked />
          <BooleanInput source="geo_listen_enabled" defaultChecked />
          <BooleanInput source="geo_speak_enabled" defaultChecked />
        </CardBox>

        <CardBox title="Contribution settings">
          <BooleanInput source="auto_submit" />
          <SelectInput
            source="ordering"
            label="Playback Ordering"
            validate={required()}
            choices={[
              { id: "by_like", name: "By Likes" },
              { id: "by_weight", name: "By Weight" },
              { id: "random", name: "Random" },
            ]}
            helperText="Order of content playback when multiple pieces are available"
          />
          <SelectInput
            source="repeat_mode"
            validate={required()}
            choices={[
              { id: "stop", name: "stop" },
              { id: "continuous", name: "continuous" },
            ]}
            fullWidth
            helperText="Behavior after all content in location already played"
          />
          <BooleanInput source="reset_tag_defaults_on_startup" />
        </CardBox>

        <CardBox title="Recording Settings">
          <NumberInput
            source="recording_radius"
            required
            fullWidth
            helperText="Radius in meters of active range each contribution"
          />
          <NumberInput
            source="max_recording_length_sec"
            validate={required()}
            fullWidth
            helperText="Max time users can speak"
          />
          <SelectInput
            source="recording_method"
            validate={required()}
            fullWidth
            choices={[
              { id: "standard", name: "Standard — one recording per contribution" },
              { id: "looping", name: "Looping — record over a shared base loop" },
            ]}
            helperText="Looping is the Collective Loops paradigm: contributions become speakers in a synced mix, rather than assets on the map"
          />
          <NumberInput
            source="speaker_attenuation_distance"
            fullWidth
            min={0}
            step={1}
            helperText="Default attenuation distance (meters) for new speakers created via the web app; can be overridden per-speaker"
          />
          {/* audio_stream_bitrate hidden — managed server-side */}
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
                helperText="Distance from nearest speaker threshold to trigger Out Of Range warning"
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

        <AdvancedConfigInput />
      </SimpleForm>
      <DeleteProjectSection />
    </Edit>
  );
};

export default ProjectEdit;
