// ---------------------------------------------------------------------------
// Notifications — who is told when something happens in this project
// (roundware-server-v3 docs/019). Today: an email for each new contribution,
// so someone can look at it.
//
// Each card is a rule: when <event>, tell <a role, team members, outside
// addresses>. Changes save as they're made. Outside addresses can
// unsubscribe themselves from the email; team members are told to come here.
// ---------------------------------------------------------------------------
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SendIcon from "@mui/icons-material/SendOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Link,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { Title } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "../Publish/api";

interface Recipient {
  kind: "role" | "member" | "email";
  role?: string | null;
  user_id?: number | null;
  email?: string | null;
}

interface Rule {
  id: number;
  project_id: number;
  event: string;
  channel: string;
  is_active: boolean;
  recipients: (Recipient & { id: number })[];
  reaches: number;
}

interface EventInfo {
  key: string;
  label: string;
  description: string;
}

interface Member {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

// "That role or higher" (server core/notifications.ROLE_RANK).
const ROLE_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "No one by role" },
  { value: "owner", label: "Owners" },
  { value: "admin", label: "Admins and owners" },
  { value: "editor", label: "Editors, admins and owners" },
  { value: "viewer", label: "Everyone on the team" },
];

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const memberName = (m: Member) =>
  [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;

const asList = <T,>(json: unknown): T[] =>
  (Array.isArray(json) ? json : (json as { results?: T[] })?.results ?? []) as T[];

const NotificationsPage: React.FC = () => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.id;
  const [rules, setRules] = useState<Rule[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [autoSubmit, setAutoSubmit] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [r, e, m, p] = await Promise.all([
        apiFetcher(`/notification-rules/?project_id=${projectId}`),
        apiFetcher(`/notification-rules/events/`),
        apiFetcher(`/users/`),
        apiFetcher(`/projects/${projectId}/`),
      ]);
      setRules(asList<Rule>(r.json));
      setEvents((e.json as { events: EventInfo[] }).events);
      setMembers(asList<Member>(m.json));
      setAutoSubmit(Boolean((p.json as { auto_submit?: boolean }).auto_submit));
      setError(null);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (rule: Rule) => setRules((rs) => rs.map((r) => (r.id === rule.id ? rule : r)));

  const patch = async (rule: Rule, body: Partial<Pick<Rule, "event" | "is_active">> & { recipients?: Recipient[] }) => {
    try {
      const { json } = await apiFetcher(`/notification-rules/${rule.id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      replace(json as Rule);
      setError(null);
    } catch (err) {
      setError(errMessage(err));
      load();
    }
  };

  const create = async (recipients: Recipient[]) => {
    try {
      const { json } = await apiFetcher(`/notification-rules/`, {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, event: "contribution.created", recipients }),
      });
      setRules((rs) => [...rs, json as Rule]);
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const remove = async (rule: Rule) => {
    if (!window.confirm("Stop these notifications?")) return;
    try {
      await apiFetcher(`/notification-rules/${rule.id}/`, { method: "DELETE" });
      setRules((rs) => rs.filter((r) => r.id !== rule.id));
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const test = async (rule: Rule) => {
    try {
      const { json } = await apiFetcher(`/notification-rules/${rule.id}/test/`, { method: "POST" });
      const sent = (json as { sent: number }).sent;
      setNotice(sent ? `Test sent to ${sent} ${sent === 1 ? "address" : "addresses"}.` : "No one to send a test to yet.");
    } catch (err) {
      setError(errMessage(err));
    }
  };

  if (!selectedProject) {
    return (
      <Container sx={{ py: 4 }}>
        <Title title="Notifications" />
        <Typography color="text.secondary">Select a project first.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Title title="Notifications" />
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Who gets an email when someone contributes to this project — so a person can look at
        each new contribution, and hide it if it shouldn&apos;t be there.
      </Typography>

      {autoSubmit !== null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {autoSubmit
            ? "New contributions go live at once; the email says so, with a link to review it."
            : "New contributions wait for approval — participants don't see them until someone marks them Submitted; the email links straight to them."}{" "}
          <Link component={RouterLink} to={`/project/${projectId}/projects/${projectId}`}>
            Change this in Project Settings
          </Link>{" "}
          (<em>Publish new contributions automatically</em>).
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : rules.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography gutterBottom>No one is told about new contributions yet.</Typography>
            <Button variant="contained" onClick={() => create([{ kind: "role", role: "admin" }])}>
              Email admins about new contributions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              events={events}
              members={members}
              onPatch={(body) => patch(rule, body)}
              onTest={() => test(rule)}
              onRemove={() => remove(rule)}
            />
          ))}
          <Box>
            <Button onClick={() => create([])}>Add another</Button>
          </Box>
        </Stack>
      )}
    </Container>
  );
};

interface CardProps {
  rule: Rule;
  events: EventInfo[];
  members: Member[];
  onPatch: (body: Partial<Pick<Rule, "event" | "is_active">> & { recipients?: Recipient[] }) => void;
  onTest: () => void;
  onRemove: () => void;
}

const RuleCard: React.FC<CardProps> = ({ rule, events, members, onPatch, onTest, onRemove }) => {
  const role = rule.recipients.find((r) => r.kind === "role")?.role ?? "";
  const memberIds = rule.recipients.filter((r) => r.kind === "member").map((r) => r.user_id!);
  const emails = rule.recipients.filter((r) => r.kind === "email").map((r) => r.email!);
  const [emailError, setEmailError] = useState<string | null>(null);

  const save = (next: { role?: string; memberIds?: number[]; emails?: string[] }) => {
    const r = next.role ?? role;
    const recipients: Recipient[] = [
      ...(r ? [{ kind: "role" as const, role: r }] : []),
      ...(next.memberIds ?? memberIds).map((id) => ({ kind: "member" as const, user_id: id })),
      ...(next.emails ?? emails).map((e) => ({ kind: "email" as const, email: e })),
    ];
    onPatch({ recipients });
  };

  return (
    <Card variant="outlined" sx={{ opacity: rule.is_active ? 1 : 0.6 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="When"
            value={rule.event}
            onChange={(e) => onPatch({ event: e.target.value })}
            sx={{ minWidth: 220 }}
          >
            {events.map((ev) => (
              <MenuItem key={ev.key} value={ev.key}>
                {ev.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={rule.is_active ? "On" : "Off"}>
            <Switch
              checked={rule.is_active}
              onChange={(_e, on) => onPatch({ is_active: on })}
              slotProps={{ input: { "aria-label": "Send these notifications" } }}
            />
          </Tooltip>
          <Tooltip title="Stop these notifications">
            <IconButton onClick={onRemove} aria-label="Remove">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Email
        </Typography>
        <Stack spacing={2}>
          <TextField
            select
            size="small"
            label="Team, by role"
            value={role}
            onChange={(e) => save({ role: e.target.value })}
            helperText="Only those who can see this project."
          >
            {ROLE_CHOICES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            size="small"
            options={members}
            getOptionLabel={(m) => `${memberName(m)} (${m.email})`}
            value={members.filter((m) => memberIds.includes(m.id))}
            onChange={(_e, picked) => save({ memberIds: picked.map((m) => m.id) })}
            renderInput={(params) => <TextField {...params} label="Team members" />}
          />
          <Autocomplete
            multiple
            freeSolo
            // An address typed and then left (clicking elsewhere) is added
            // too — it used to stay as unsaved text that looked saved.
            autoSelect
            size="small"
            options={[] as string[]}
            value={emails}
            onChange={(_e, values) => {
              // Several pasted at once — "a@x.org, b@y.org" — are each added.
              const cleaned = (values as string[])
                .flatMap((v) => v.split(/[\s,;]+/))
                .map((v) => v.trim())
                .filter(Boolean);
              const bad = cleaned.find((v) => !EMAIL.test(v));
              if (bad) {
                setEmailError(`“${bad}” isn't an email address.`);
                return;
              }
              setEmailError(null);
              save({ emails: Array.from(new Set(cleaned)) });
            }}
            renderTags={(value, getTagProps) =>
              value.map((v, i) => {
                const { key, ...props } = getTagProps({ index: i });
                return <Chip key={key} label={v} size="small" {...props} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Other email addresses"
                placeholder="Type or paste addresses"
                error={!!emailError}
                helperText={emailError ?? "People outside the team, such as a moderator. Each email lets them stop these."}
              />
            )}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {rule.reaches === 0
              ? "Reaches no one yet."
              : `Reaches ${rule.reaches} ${rule.reaches === 1 ? "address" : "addresses"} now.`}
          </Typography>
          <Button size="small" startIcon={<SendIcon />} onClick={onTest} disabled={rule.reaches === 0}>
            Send a test
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NotificationsPage;
