import React, { useCallback, useState } from "react";
import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { Title } from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import DeployCard from "./DeployCard";
import BrandingPanel from "./BrandingPanel";
import PreviewPanel from "./PreviewPanel";

const PublishPage: React.FC = () => {
  const { selectedProject } = useProjects();
  // Bumped whenever branding is saved → reloads the preview iframe.
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSaved = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!selectedProject) {
    return (
      <Container sx={{ py: 4 }}>
        <Title title="Publish" />
        <Typography variant="body1" color="text.secondary">
          Select a project to publish it to the web.
        </Typography>
      </Container>
    );
  }

  const projectId = selectedProject.id;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Publish" />
      <Typography variant="h4" gutterBottom>
        Publish &amp; Customize
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choose your public web address, customize the look, and preview exactly
        what participants will see.
      </Typography>

      <DeployCard projectId={projectId} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <BrandingPanel projectId={projectId} onSaved={handleSaved} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box>
                <PreviewPanel projectId={projectId} refreshKey={refreshKey} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PublishPage;
