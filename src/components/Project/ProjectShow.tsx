import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  BooleanField,
  ReferenceArrayField,
  SingleFieldList,
  ChipField,
  ReferenceField,
  useShowController,
  useRedirect,
  Labeled,
} from "react-admin";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { useProjects } from "../../context/ProjectsContext";
import LocalizedShowField from "../common/LocalizedShowField";

/** Thin wrapper that renders a labelled field inside a fixed-width grid cell. */
const Field = ({
  children,
  xs = 12,
  sm = 6,
  md = 4,
}: {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
}) => (
  <Grid size={{ xs, sm, md }}>
    {children}
  </Grid>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card sx={{ mb: 2 }} variant="outlined">
    <CardContent>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {children}
      </Grid>
    </CardContent>
  </Card>
);

const ProjectShow = (): JSX.Element => {
  const { selectedProject } = useProjects();
  const redirect = useRedirect();
  const { record } = useShowController();

  React.useEffect(() => {
    if (!record) return;
    if (record?.id !== selectedProject?.id) {
      redirect(`/projects/${selectedProject?.id}/show`);
    }
  }, [selectedProject, record]);

  return (
    <Show title="Project Details">
      <SimpleShowLayout>
        <Box sx={{ p: 1 }}>
          {/* ---- General ---- */}
          <Section title="General">
            <Field md={6}>
              <Labeled label="Name">
                <TextField source="name" />
              </Labeled>
            </Field>
            <Field md={3}>
              <Labeled label="ID">
                <TextField source="id" />
              </Labeled>
            </Field>
            <Field md={3}>
              <Labeled label="Active">
                <BooleanField source="is_active" />
              </Labeled>
            </Field>
            <Field xs={12}>
              <Labeled label="Description">
                <LocalizedShowField source="description_loc_admin" fallbackSource="description" />
              </Labeled>
            </Field>
            <Field md={6}>
              <Labeled label="Languages">
                <ReferenceArrayField source="language_ids" reference="languages">
                  <SingleFieldList linkType={false}>
                    <ChipField source="name" size="small" />
                  </SingleFieldList>
                </ReferenceArrayField>
              </Labeled>
            </Field>
            <Field md={6}>
              <Labeled label="Default Language">
                <ReferenceField source="default_language_id" reference="languages" link={false} emptyText="—">
                  <TextField source="name" />
                </ReferenceField>
              </Labeled>
            </Field>
          </Section>

          {/* ---- Location ---- */}
          <Section title="Location">
            <Field>
              <Labeled label="Latitude">
                <NumberField source="latitude" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Longitude">
                <NumberField source="longitude" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Recording Radius (m)">
                <NumberField source="recording_radius" />
              </Labeled>
            </Field>
          </Section>

          {/* ---- Modes ---- */}
          <Section title="Modes">
            <Field sm={3}>
              <Labeled label="Listen">
                <BooleanField source="listen_enabled" />
              </Labeled>
            </Field>
            <Field sm={3}>
              <Labeled label="Speak">
                <BooleanField source="speak_enabled" />
              </Labeled>
            </Field>
            <Field sm={3}>
              <Labeled label="Geo Listen">
                <BooleanField source="geo_listen_enabled" />
              </Labeled>
            </Field>
            <Field sm={3}>
              <Labeled label="Geo Speak">
                <BooleanField source="geo_speak_enabled" />
              </Labeled>
            </Field>
          </Section>

          {/* ---- Asset & Recording ---- */}
          <Section title="Asset & Recording Settings">
            <Field>
              <Labeled label="Auto Submit">
                <BooleanField source="auto_submit" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Ordering">
                <TextField source="ordering" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Repeat Mode">
                <TextField source="repeat_mode" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Max Recording Length (sec)">
                <NumberField source="max_recording_length_sec" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Reset Tag Defaults on Startup">
                <BooleanField source="reset_tag_defaults_on_startup" />
              </Labeled>
            </Field>
            <Field>
              <Labeled label="Timed Asset Priority">
                <BooleanField source="timed_asset_priority" />
              </Labeled>
            </Field>
          </Section>

          {/* ---- Sharing & Out of Range ---- */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Section title="Sharing">
                <Field xs={12}>
                  <Labeled label="Sharing URL">
                    <TextField source="sharing_url" emptyText="—" />
                  </Labeled>
                </Field>
                <Field xs={12}>
                  <Labeled label="Sharing Message">
                    <LocalizedShowField source="sharing_message_loc_admin" fallbackSource="sharing_message" />
                  </Labeled>
                </Field>
              </Section>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Section title="Out of Range">
                <Field xs={12} sm={12}>
                  <Labeled label="Distance (m)">
                    <NumberField source="out_of_range_distance" />
                  </Labeled>
                </Field>
                <Field xs={12} sm={12}>
                  <Labeled label="Out of Range Message">
                    <LocalizedShowField source="out_of_range_message_loc_admin" fallbackSource="out_of_range_message" />
                  </Labeled>
                </Field>
              </Section>
            </Grid>
          </Grid>

          {/* ---- Text / Legal ---- */}
          <Section title="Text & Legal">
            <Field xs={12} md={6}>
              <Labeled label="Legal Agreement">
                <LocalizedShowField source="legal_agreement_loc_admin" fallbackSource="legal_agreement" />
              </Labeled>
            </Field>
            <Field xs={12} md={6}>
              <Labeled label="Speak Button Text">
                <LocalizedShowField source="speak_button_text_loc_admin" fallbackSource="speak_button_text" />
              </Labeled>
            </Field>
          </Section>

          {/* ---- Demo Stream ---- */}
          <Section title="Demo Stream">
            <Field>
              <Labeled label="Enabled">
                <BooleanField source="demo_stream_enabled" />
              </Labeled>
            </Field>
            <Field md={8}>
              <Labeled label="Stream URL">
                <TextField source="demo_stream_url" emptyText="—" />
              </Labeled>
            </Field>
          </Section>
        </Box>
      </SimpleShowLayout>
    </Show>
  );
};

export default ProjectShow;
