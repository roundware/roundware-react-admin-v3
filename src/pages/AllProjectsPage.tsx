// ---------------------------------------------------------------------------
// Every organization's projects, for superusers (Platform › All Projects).
// One list, with each project's organization and addresses; a row opens the
// project in its organization (the admin's ?tenant= links switch to it).
// ---------------------------------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Chip,
  CircularProgress,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Title } from "react-admin";
import { apiFetcher } from "../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "./Publish/api";

interface PlatformProject {
  id: number;
  name: string;
  is_active: boolean;
  recording_method: string;
  created_at: string;
  tenant_id: number;
  tenant_name: string;
  tenant_slug: string;
  /** Its Roundware subdomain, once published. */
  address: string | null;
  /** Its own address (server docs/028), once connected. */
  custom_url: string | null;
}

const AllProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<PlatformProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    apiFetcher("/tenants/projects/")
      .then(({ json }) => setProjects(json as PlatformProject[]))
      .catch((e) => setError(errMessage(e)));
  }, []);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!projects || !q) return projects ?? [];
    return projects.filter((p) =>
      [p.name, p.tenant_name, p.tenant_slug, p.address ?? "", p.custom_url ?? "", String(p.id)].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [projects, filter]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Title title="All Projects" />
      <Typography variant="h4" gutterBottom>
        All Projects
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Every organization's projects. Opening one switches to its organization.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        size="small"
        label="Find"
        placeholder="Project, organization, address or id"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 360 }}
      />

      {!projects && !error ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {shown.length} of {projects?.length ?? 0}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Address</TableCell>
                <TableCell align="right">Id</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {/* A full load: the admin switches organization before anything loads. */}
                      <Link href={`/project/${p.id}?tenant=${encodeURIComponent(p.tenant_slug)}`}>{p.name}</Link>
                      {!p.is_active && <Chip label="Inactive" size="small" />}
                      {p.recording_method === "looping" && <Chip label="Looping" size="small" variant="outlined" />}
                    </Stack>
                  </TableCell>
                  <TableCell>{p.tenant_name}</TableCell>
                  <TableCell>
                    {p.custom_url || p.address ? (
                      <Link href={`https://${p.custom_url || p.address}`} target="_blank" rel="noopener">
                        {p.custom_url || p.address}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="text.secondary" component="span">
                        Not published
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{p.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Container>
  );
};

export default AllProjectsPage;
