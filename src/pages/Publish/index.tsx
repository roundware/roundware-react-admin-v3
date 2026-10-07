import React, { useCallback, useState } from "react";
import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { Title } from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import DeployCard from "./DeployCard";
import LiveSiteCard from "./LiveSiteCard";
import BrandingPanel from "./BrandingPanel";
import PreviewPanel from "./PreviewPanel";
import ParadigmWarning from "./ParadigmWarning";
import MapAppearanceEditor from "./MapAppearanceEditor";

// Customize and Publish were one page, "Customize & Publish". They are two
// now: how the app looks and reads, and where it lives. Both show the live
// preview — one component, so it costs nothing to have it twice.

const NoProject = ({ title, what }: { title: string; what: string }) => (
  <Container sx={{ py: 4 }}>
    <Title title={title} />
    <Typography variant="body1" color="text.secondary">
      Select a project to {what}.
    </Typography>
  </Container>
);

/** How the app looks and reads: branding, look & feel, files, info panel, map. */
export const CustomizePage: React.FC = () => {
  const { selectedProject } = useProjects();
  // Bumped whenever branding is saved → reloads the preview iframe.
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSaved = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!selectedProject) return <NoProject title="Look & Feel" what="change how it looks" />;
  const projectId = selectedProject.id;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Look & Feel" />
      <Typography variant="h4" gutterBottom>
        Look &amp; Feel
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        How the app looks and reads. The preview shows the app with your latest changes; once published, participants see them when you update the live site (Publish).
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <BrandingPanel projectId={projectId} onSaved={handleSaved} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 80 } }}>
            <CardContent>
              <Box>
                <PreviewPanel projectId={projectId} refreshKey={refreshKey} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Full width: placing an overlay needs a map large enough to see
            what it lines up with. */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <MapAppearanceEditor
                projectId={projectId}
                onSaved={handleSaved}
                brandingVersion={refreshKey}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

/**
 * The web app itself, full size, to try out as a participant would: the same
 * preview as Look & Feel and Publish, with the page to itself. It is the test
 * site (server docs/021), so anything recorded here is marked as a test.
 */
export const TestAppPage: React.FC = () => {
  const { selectedProject } = useProjects();
  if (!selectedProject) return <NoProject title="Test App" what="try it" />;
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Test App" />
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        The app as it is now, with your latest changes, whether or not
        they're live yet. Anything you record here is marked as a test: it
        shows only on the test site and here in the admin, and can be
        deleted from Publish.
      </Typography>
      <PreviewPanel
        projectId={selectedProject.id}
        refreshKey={0}
        title="Test App"
        height="calc(100vh - 230px)"
      />
    </Container>
  );
};

/** Where the app lives: its web address, deploying and unpublishing, and
 *  putting changes live (server docs/021). */
const PublishPage: React.FC = () => {
  const { selectedProject } = useProjects();
  // Bumped when the address changes, so the live-site card reloads.
  const [deployKey, setDeployKey] = useState(0);
  const handleDeployChange = useCallback(() => setDeployKey((k) => k + 1), []);

  if (!selectedProject) return <NoProject title="Publish" what="publish it to the web" />;
  const projectId = selectedProject.id;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Publish" />
      <Typography variant="h4" gutterBottom>
        Publish
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choose your public web address, put the app online, and choose when
        your changes go live.
      </Typography>

      <ParadigmWarning project={selectedProject} />

      <DeployCard projectId={projectId} onChange={handleDeployChange} />
      <LiveSiteCard projectId={projectId} refreshKey={deployKey} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <PreviewPanel projectId={projectId} refreshKey={0} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PublishPage;
