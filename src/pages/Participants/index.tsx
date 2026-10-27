// ---------------------------------------------------------------------------
// Participants (2026-10-27), for owners and admins: the people who took part
// in the project — listened, recorded or made a loop — and one of them with
// what they did here. A participant is a device in the organization, as
// Roundware knows it (server participants routes); its contact details are
// what it chose to give while recording (docs/023), kept on the participant
// and shown with each of its contributions. They can be corrected or
// cleared here (a typo, a privacy request) — for every project of the
// organization, since they're the participant's. Later, a participant can
// claim an account (server docs/018, "Participant accounts").
// A participant who withdraws can be deleted for good (2026-10-27): what they
// made here, its files, and their sessions — the privacy policy's promise.
// ---------------------------------------------------------------------------
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Link,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { Labeled, Title, useNotify, usePermissions, useRecordContext } from "react-admin";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "../Publish/api";

interface Summary {
  id: number;
  contact_name: string;
  contact_email: string;
  client_type: string | null;
  claimed: boolean;
  created_at: string;
  first_seen: string;
  last_seen: string;
  sessions: number;
  contributions: number;
  loops: number;
}

interface Detail extends Summary {
  session_list: { id: number; started_at: string; stopped_at: string | null; client_type: string | null; client_system: string | null }[];
  contribution_list: { id: number; created_at: string; media_type: string; description: string; submitted: boolean; audio_length_sec: number | null }[];
  loop_list: { id: number; code: string; is_active: boolean; created_at: string }[];
  listens: number;
  votes: number;
  events: number;
  other_projects: { id: number; name: string }[];
}

const PAGE = 100;

const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString() : "—");

/** Owners and admins (and superusers): the participant pages and the links to them. */
export const useCanSeeParticipants = (): boolean => {
  const { permissions } = usePermissions();
  return !!permissions?.isSuperuser || permissions?.role === "owner" || permissions?.role === "admin";
};

/** "Participant #12", linked to their page — for owners and admins only. */
export const ParticipantLink: React.FC<{ id: number | null | undefined; label?: string }> = ({ id, label }) => {
  const { selectedProject } = useProjects();
  const can = useCanSeeParticipants();
  if (!id || !selectedProject) return null;
  const text = label ?? `Participant #${id}`;
  if (!can) return <span>{text}</span>;
  return (
    <Link component={RouterLink} to={`/project/${selectedProject.id}/participants/${id}`} onClick={(e) => e.stopPropagation()}>
      {text}
    </Link>
  );
};

/** On a session, contribution or loop: its participant, linked — owners and
 *  admins only; nothing without one. */
export const RecordParticipant: React.FC<{ label?: string }> = ({ label = "Participant" }) => {
  const r = useRecordContext<{ participant_id?: number | null }>();
  const can = useCanSeeParticipants();
  if (!can || !r?.participant_id) return null;
  return (
    <Labeled label={label} fullWidth>
      <Box component="span" sx={{ fontSize: 14 }}>
        <ParticipantLink id={r.participant_id} />
      </Box>
    </Labeled>
  );
};

const NoProject = ({ title }: { title: string }) => (
  <Container sx={{ py: 4 }}>
    <Title title={title} />
    <Typography color="text.secondary">Select a project to see its participants.</Typography>
  </Container>
);

export const ParticipantsPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const [rows, setRows] = useState<Summary[]>([]);
  const [count, setCount] = useState(0);
  const [onlyContact, setOnlyContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number) => {
      if (!projectId) return;
      setLoading(true);
      try {
        const q = new URLSearchParams({ project_id: String(projectId), limit: String(PAGE), offset: String(offset) });
        if (onlyContact) q.set("has_contact", "true");
        const { json } = await apiFetcher(`/participants/?${q}`);
        const body = json as { count: number; results: Summary[] };
        setCount(body.count);
        setRows((r) => (offset === 0 ? body.results : [...r, ...body.results]));
        setError(null);
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [projectId, onlyContact]
  );
  useEffect(() => {
    void load(0);
  }, [load]);

  if (!selectedProject) return <NoProject title="Participants" />;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Title title="Participants" />
      <Typography variant="h4" gutterBottom>
        Participants
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 860 }}>
        The people who took part in this project — listened, recorded or made a loop — as Roundware knows them:
        one per device, or per visit to an embedded recorder. Contact details are what they chose to give while
        recording, and only your team sees them.
      </Typography>
      <FormControlLabel
        control={<Switch checked={onlyContact} onChange={(_e, on) => setOnlyContact(on)} />}
        label="Only people who left contact details"
        sx={{ mb: 1 }}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Participant</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>First seen</TableCell>
              <TableCell>Last seen</TableCell>
              <TableCell align="right">Sessions</TableCell>
              <TableCell align="right">Contributions</TableCell>
              <TableCell align="right">Loops</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <ParticipantLink id={p.id} />
                  {p.claimed && <Chip label="Account" size="small" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>
                  {p.contact_name}
                  {p.contact_name && p.contact_email ? " · " : ""}
                  {p.contact_email && <Link href={`mailto:${p.contact_email}`}>{p.contact_email}</Link>}
                  {!p.contact_name && !p.contact_email && (
                    <Typography component="span" variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{p.client_type || "—"}</TableCell>
                <TableCell>{when(p.first_seen)}</TableCell>
                <TableCell>{when(p.last_seen)}</TableCell>
                <TableCell align="right">{p.sessions}</TableCell>
                <TableCell align="right">{p.contributions}</TableCell>
                <TableCell align="right">{p.loops}</TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {onlyContact ? "Nobody has left contact details yet." : "Nobody has taken part yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {rows.length} of {count}
        </Typography>
        {loading && <CircularProgress size={18} />}
        {!loading && rows.length < count && (
          <Button size="small" onClick={() => load(rows.length)}>
            Show more
          </Button>
        )}
      </Stack>
    </Container>
  );
};

export const ParticipantPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const { participantId } = useParams();
  const [p, setP] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!projectId || !participantId) return;
    let cancelled = false;
    apiFetcher(`/participants/${participantId}/?project_id=${projectId}`)
      .then(({ json }) => {
        if (cancelled) return;
        const d = json as Detail;
        setP(d);
        setName(d.contact_name);
        setEmail(d.contact_email);
      })
      .catch((e) => !cancelled && setError(errMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [projectId, participantId]);

  const save = async (contact: { contact_name: string; contact_email: string }) => {
    if (!p || !projectId) return;
    setSaving(true);
    setSaved(false);
    try {
      const { json } = await apiFetcher(`/participants/${p.id}/?project_id=${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(contact),
      });
      const s = json as Summary;
      setP({ ...p, ...s });
      setName(s.contact_name);
      setEmail(s.contact_email);
      setSaved(true);
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!selectedProject) return <NoProject title="Participant" />;
  const base = `/project/${selectedProject.id}`;
  const changed = !!p && (name !== p.contact_name || email !== p.contact_email);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Title title={p ? `Participant #${p.id}` : "Participant"} />
      <Link component={RouterLink} to={`${base}/participants`} variant="body2">
        ← Participants
      </Link>
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      {!p && !error && <CircularProgress sx={{ mt: 3 }} />}
      {p && (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h4">Participant #{p.id}</Typography>
            {p.claimed && <Chip label="Has an account" size="small" />}
          </Stack>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    What they gave while recording. Correct or clear them here (a typo, a request to remove them):
                    the change applies in every project of your organization they took part in.
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField size="small" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <TextField size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button variant="contained" size="small" disabled={!changed || saving} onClick={() => save({ contact_name: name, contact_email: email })}>
                        Save
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={saving || (!p.contact_name && !p.contact_email)}
                        onClick={() => {
                          if (window.confirm("Clear this participant's name and email?")) void save({ contact_name: "", contact_email: "" });
                        }}
                      >
                        Clear contact details
                      </Button>
                      {saved && !changed && (
                        <Typography variant="body2" color="success.main">
                          Saved
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    In this project
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {[
                        ["First seen", when(p.first_seen)],
                        ["Last seen", when(p.last_seen)],
                        ["Device", p.client_type || "—"],
                        ["Sessions", p.sessions],
                        ["Contributions", p.contributions],
                        ["Loops", p.loops],
                        ["Listens", p.listens],
                        ["Votes", p.votes],
                      ].map(([k, v]) => (
                        <TableRow key={String(k)}>
                          <TableCell sx={{ color: "text.secondary", width: 140 }}>{k}</TableCell>
                          <TableCell>{v}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Section title={`Contributions (${p.contribution_list.length})`} empty="None in this project.">
            {p.contribution_list.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Contribution</TableCell>
                    <TableCell>Made</TableCell>
                    <TableCell>Kind</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.contribution_list.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Link component={RouterLink} to={`${base}/assets/${a.id}`}>
                          #{a.id}
                        </Link>
                      </TableCell>
                      <TableCell>{when(a.created_at)}</TableCell>
                      <TableCell>
                        {a.media_type}
                        {a.audio_length_sec ? ` · ${Math.round(a.audio_length_sec)}s` : ""}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.description || "—"}
                      </TableCell>
                      <TableCell>{a.submitted ? "Live" : "Waiting for approval"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          {p.loop_list.length > 0 && (
            <Section title={`Loops (${p.loop_list.length})`} empty="">
              <Table size="small">
                <TableBody>
                  {p.loop_list.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Link component={RouterLink} to={`${base}/speakers/${s.id}`}>
                          Speaker #{s.id}
                        </Link>
                        {s.code ? ` · ${s.code}` : ""}
                      </TableCell>
                      <TableCell>{when(s.created_at)}</TableCell>
                      <TableCell>{s.is_active ? "Active" : "Inactive"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          )}

          <Section title={`Sessions (${p.sessions})`} empty="None in this project.">
            {p.session_list.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Stopped</TableCell>
                    <TableCell>Device</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.session_list.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Link component={RouterLink} to={`${base}/sessions/${s.id}`}>
                          #{s.id}
                        </Link>
                      </TableCell>
                      <TableCell>{when(s.started_at)}</TableCell>
                      <TableCell>{when(s.stopped_at)}</TableCell>
                      {/* client_system is the browser's whole identification string: a line of it, all of it on hover. */}
                      <TableCell
                        title={s.client_system ?? undefined}
                        sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {[s.client_type, s.client_system].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {p.sessions > p.session_list.length && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                The latest {p.session_list.length} shown.
              </Typography>
            )}
          </Section>

          <DeleteForGood p={p} projectId={selectedProject.id} />
        </>
      )}
    </Container>
  );
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** For a participant who withdraws: what they made here, its files, and
 *  their sessions, deleted for good (server participants routes, DELETE). */
const DeleteForGood: React.FC<{ p: Detail; projectId: number }> = ({ p, projectId }) => {
  const notify = useNotify();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [everywhere, setEverywhere] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const others = p.other_projects ?? [];

  const close = () => {
    if (busy) return;
    setOpen(false);
    setUnderstood(false);
    setEverywhere(false);
    setError(null);
  };
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const { json } = await apiFetcher(`/participants/${p.id}/?project_id=${projectId}&everywhere=${everywhere}`, { method: "DELETE" });
      const d = json.deleted as Record<string, number>;
      notify(
        `Deleted ${plural(d.contributions, "contribution")}, ${plural(d.loops, "loop")} and ${plural(d.sessions, "session")}` +
          (json.participant_deleted ? ", and the participant." : "."),
        { type: "success" }
      );
      navigate(`/project/${projectId}/participants`);
    } catch (e) {
      setError(errMessage(e));
      setBusy(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, borderColor: "error.light" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Delete for good
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          When a participant asks to withdraw: everything they made in this project, with its audio files and photos, and
          their sessions here, with what they listened to and voted on. It can't be undone.
        </Typography>
        <Button variant="outlined" color="error" size="small" onClick={() => setOpen(true)}>
          Delete this participant…
        </Button>
      </CardContent>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>Delete participant #{p.id} for good?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            In this project, this deletes:
          </Typography>
          <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3, "& li": { typography: "body2" } }}>
            <li>{plural(p.contribution_list.length, "contribution")}, with their audio files, photos and attachments</li>
            {p.loop_list.length > 0 && <li>{plural(p.loop_list.length, "loop")}, with their audio</li>}
            <li>
              {plural(p.sessions, "session")}, with {plural(p.listens, "listen")} and {plural(p.votes, "vote")}
            </li>
          </Box>
          {others.length > 0 && (
            <FormControlLabel
              sx={{ mb: 1, alignItems: "flex-start" }}
              control={<Checkbox checked={everywhere} onChange={(e) => setEverywhere(e.target.checked)} sx={{ pt: 0.25 }} />}
              label={
                <Typography variant="body2">
                  Also in their other {others.length === 1 ? "project" : "projects"}: {others.map((o) => o.name).join(", ")}
                </Typography>
              }
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {others.length > 0 && !everywhere
              ? "Their contact details stay, for their other projects. Clear them above if they asked for that too."
              : "Their contact details are deleted too."}
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />}
            label={<Typography variant="body2">I understand the files are deleted too and can't be recovered.</Typography>}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={!understood || busy} onClick={run}>
            {busy ? "Deleting…" : "Delete for good"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const Section: React.FC<{ title: string; empty: string; children?: React.ReactNode }> = ({ title, empty, children }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {React.Children.toArray(children).filter(Boolean).length ? (
        <Box sx={{ overflowX: "auto" }}>{children}</Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      )}
    </CardContent>
  </Card>
);
