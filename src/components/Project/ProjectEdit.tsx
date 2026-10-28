import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import CardBox from "components/common/CardBox";
import LocationSelector from "components/common/LocationSelector";
import TranslatableField from "components/common/TranslatableField";
import { useProjects } from "context/ProjectsContext";
import { useSpeakers } from "context/SpeakersContext";
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
    useGetList,
    usePermissions,
    useRecordContext,
} from "react-admin";
import { useWatch } from "react-hook-form";
import { showsDefaultAttenuation } from "../../config/fieldVisibility";
import { useNavigate } from "react-router-dom";
import { buildLocalizationsPayload } from "../../utils";
import AdvancedConfigInput from "./AdvancedConfigInput";
import DeleteProjectDialog from "./DeleteProjectDialog";
import TermsTemplate from "components/common/TermsTemplate";

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

/**
 * Which of the project's languages is its default: what participants see
 * when a text has no translation in theirs, and the first tab of every
 * translatable field (server docs/017). Changing it keeps every text — the
 * server swaps them over.
 */
const DefaultLanguageInput = () => {
  const languageIds = (useWatch({ name: "language_ids" }) as number[] | undefined) ?? [];
  const { data: languages = [] } = useGetList("languages", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "ASC" },
  });
  const choices = languageIds
    .map((id) => languages.find((l) => Number(l.id) === Number(id)))
    .filter(Boolean)
    .map((l) => ({ id: l!.id, name: l!.name }));
  if (choices.length < 2) return null;
  return (
    <SelectInput
      source="default_language_id"
      label="Default language"
      choices={choices}
      fullWidth
      helperText="Shown when a text has no translation in a participant's language. Changing it keeps all your text."
    />
  );
};

/** A looping project always listens: participants record over what they
 *  hear, and the server refuses Listen off with looping (docs/025). */
const loopingNeedsListen = (value: unknown, all: Record<string, unknown>) =>
  value === "looping" && all?.listen_enabled === false
    ? "Looping needs Listen on: participants record over what they hear."
    : undefined;

const ListenEnabledInput = () => {
  const recordingMethod = useWatch({ name: "recording_method" }) as string | undefined;
  const looping = recordingMethod === "looping";
  return (
    <BooleanInput
      source="listen_enabled"
      defaultChecked
      disabled={looping}
      helperText={looping ? "Always on for looping: participants record over what they hear." : undefined}
    />
  );
};

/** Only looping projects' web apps create speakers, so only they use a
 *  default attenuation distance (config/fieldVisibility.ts). Follows the
 *  Recording method field above as it changes. */
const DefaultAttenuationInput = () => {
  const recordingMethod = useWatch({ name: "recording_method" }) as string | undefined;
  if (!showsDefaultAttenuation({ recording_method: recordingMethod })) return null;
  return (
    <NumberInput
      source="speaker_attenuation_distance"
      fullWidth
      min={0}
      step={1}
      helperText="Default attenuation distance (meters) for the loops participants record; each speaker can then have its own"
    />
  );
};

/** Out of range: the distance, and a word when it can't apply — an active
 *  speaker that plays everywhere leaves nowhere out of range (docs/027). */
const OutOfRangeDistanceInput = () => {
  const { speakers } = useSpeakers();
  const everywhere = (speakers ?? []).some((s) => s.is_global && s.is_active);
  return (
    <NumberInput
      source="out_of_range_distance"
      required
      fullWidth
      helperText={
        everywhere
          ? "No effect while a speaker plays everywhere: nowhere is out of range."
          : "Distance from nearest speaker threshold to trigger Out Of Range warning"
      }
    />
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
            perPage={1000}
            sort={{ field: "name", order: "ASC" }}
            label="Languages"
            validate={required()}
          >
            <SelectArrayInput
              optionText="name"
              fullWidth
              helperText="Projects can have multiple Languages assigned to them"
            />
          </ReferenceArrayInput>
          <DefaultLanguageInput />
          <TranslatableField
            label="Description"
            fromProject
            multiline
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
            helperText="Whether participants are ASKED to tag their upload. Default speak tags are applied either way, and a project with no Speak groups skips the step automatically — so turn this off only to tag silently without asking."
          />
          <BooleanInput source="allow_photos" />
          <BooleanInput source="allow_text" />
          <ListenEnabledInput />
          <BooleanInput source="speak_enabled" defaultChecked />
          <BooleanInput source="geo_listen_enabled" defaultChecked />
          <BooleanInput source="geo_speak_enabled" defaultChecked />
        </CardBox>

        <CardBox title="Contribution settings">
          <BooleanInput
            source="auto_submit"
            label="Publish new contributions automatically"
            helperText="Off: new contributions wait in Contributions until someone marks them Submitted."
          />
          <BooleanInput
            source="hold_out_of_range"
            label="Hold contributions made out of range"
            helperText="When publishing automatically: a contribution made farther than the Out of Range Distance from every active speaker waits for review."
          />
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
            validate={[required(), loopingNeedsListen]}
            fullWidth
            choices={[
              { id: "standard", name: "Standard — one recording per contribution" },
              { id: "looping", name: "Looping — record over a shared base loop" },
            ]}
            helperText="Looping is the Collective Loops paradigm: contributions become speakers in a synced mix, rather than assets on the map"
          />
          <DefaultAttenuationInput />
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
            multiline
          fromProject
          label="Legal Agreement"
        />
        <ProjectTermsTemplate />
        <Grid container spacing={2} style={{ width: "100%" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardBox title="Sharing">
              <TextInput
                source="sharing_url"
                label="Own sharing page (optional)"
                fullWidth
                helperText="Leave empty to use Roundware's share page for each contribution. To use your own instead, give its address with [id] where the contribution's number goes, e.g. https://example.org/listen?item=[id]"
              />
              <TranslatableField
                source="sharing_message_loc_admin"
                multiline
                fromProject
                label="Sharing Message"
              />
            </CardBox>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardBox title="Out of Range">
              <OutOfRangeDistanceInput />
              <TextInput
                source="out_of_range_url"
                fullWidth
                helperText="Default static stream that plays when listener is out of range upon opening client"
              />
              <TranslatableField
                source="out_of_range_message_loc_admin"
                multiline
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
            multiline
            fromProject
            label="Demo Stream Message"
          />
        </CardBox>

        {/* The author's own Google Analytics (server docs/010): the live web
            app loads Google's script with it; empty, nothing of Google's
            loads. Not on the test site or in the preview. */}
        <CardBox title="Analytics">
          <TextInput
            source="google_analytics_id"
            label="Google Analytics measurement ID"
            placeholder="G-XXXXXXXXXX"
            fullWidth
            parse={(v: string) => v ?? ""}
            helperText="Your own Google Analytics 4 property, from its data stream (Admin › Data streams). Counts visits to the live site only. Leave empty for no analytics."
          />
          {/* Off: the web app asks visitors first (Privacy Policy §7). */}
          <BooleanInput
            source="analytics_consent_by_org"
            label="We ask visitors for consent ourselves"
            helperText="Off (recommended): the site asks each visitor first, and Google Analytics loads only if they allow it. On: the site doesn't ask, and getting visitors' consent where the law requires it (the EU, the UK and elsewhere) is up to you, for example through your own website's cookie notice."
          />
        </CardBox>

        <AdvancedConfigInput />
      </SimpleForm>
      <DeleteProjectSection />
    </Edit>
  );
};

export default ProjectEdit;

/** The participant terms template, named for this project (copy and paste
 *  it into the Legal Agreement above). */
const ProjectTermsTemplate = () => {
  const record = useRecordContext<{ name?: string }>();
  return (
    <Box sx={{ mt: -1, mb: 2 }}>
      <TermsTemplate projectName={record?.name ?? ""} />
    </Box>
  );
};
