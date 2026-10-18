// ---------------------------------------------------------------------------
// Platform › Notifications — superusers told what's happening across the
// platform (roundware-server-v3 docs/026): sign-ups at once, the rest in a
// digest by organization and project, never their own actions.
//
// Each card is a rule: these events, sent immediately or as a digest on a
// schedule, to every superuser and/or outside addresses, leaving out any
// organizations named. Changes save as they're made. Below the rules, the
// latest activity itself.
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
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  FormGroup,
  IconButton,
  Link,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Title } from "react-admin";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { errMessage } from "../Publish/api";

type Delivery = "immediate" | "hourly" | "daily" | "weekly";

interface Recipient {
  kind: "superusers" | "user" | "email";
  user_id?: number | null;
  email?: string | null;
}

interface Rule {
  id: number;
  name: string;
  events: string[];
  is_active: boolean;
  delivery: Delivery;
  hour: number;
  weekday: number;
  timezone: string;
  exclude_tenant_ids: number[];
  recipients: (Recipient & { id: number })[];
  last_digest_at: string | null;
  next_digest_at: string | null;
  reaches: number;
}

type RulePatch = Partial<Omit<Rule, "id" | "recipients" | "reaches" | "last_digest_at" | "next_digest_at">> & {
  recipients?: Recipient[];
};

interface EventInfo {
  key: string;
  label: string;
  description: string;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

interface Activity {
  id: number;
  occurred_at: string;
  event: string;
  tenant_id: number | null;
  tenant_label: string;
  project_id: number | null;
  project_label: string;
  actor_label: string;
  summary: string;
  data: { tenant_slug?: string };
}

const DELIVERIES: { value: Delivery; label: string }[] = [
  { value: "immediate", label: "Immediately, one email each" },
  { value: "hourly", label: "Hourly digest" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const asList = <T,>(json: unknown): T[] =>
  (Array.isArray(json) ? json : (json as { results?: T[] })?.results ?? []) as T[];

// Every timezone the browser knows, the browser's own first.
const TIMEZONES: string[] = (() => {
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let all: string[] = [];
  try {
    all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    all = [];
  }
  return Array.from(new Set([own, "UTC", ...all]));
})();

const when = (iso: string, timeZone?: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: timeZone ? "short" : undefined,
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
};

const PlatformNotificationsPage: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, e, t, a] = await Promise.all([
        apiFetcher(`/platform-notifications/rules/`),
        apiFetcher(`/platform-notifications/events/`),
        apiFetcher(`/tenants/`),
        apiFetcher(`/platform-notifications/activity/?limit=50`),
      ]);
      setRules(asList<Rule>(r.json));
      setEvents((e.json as { events: EventInfo[] }).events);
      setTenants(asList<Tenant>(t.json));
      setActivity(asList<Activity>(a.json));
      setError(null);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (rule: Rule) => setRules((rs) => rs.map((r) => (r.id === rule.id ? rule : r)));

  const patch = async (rule: Rule, body: RulePatch) => {
    // Shown at once; the server's answer (reaches, next digest) follows.
    setRules((rs) => rs.map((r) => (r.id === rule.id ? ({ ...r, ...body } as Rule) : r)));
    try {
      const { json } = await apiFetcher(`/platform-notifications/rules/${rule.id}/`, {
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

  const create = async () => {
    try {
      const { json } = await apiFetcher(`/platform-notifications/rules/`, {
        method: "POST",
        body: JSON.stringify({
          name: "",
          events: [],
          delivery: "daily",
          hour: 8,
          timezone: TIMEZONES[0],
        }),
      });
      setRules((rs) => [...rs, json as Rule]);
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const remove = async (rule: Rule) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await apiFetcher(`/platform-notifications/rules/${rule.id}/`, { method: "DELETE" });
      setRules((rs) => rs.filter((r) => r.id !== rule.id));
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const test = async (rule: Rule) => {
    try {
      const { json } = await apiFetcher(`/platform-notifications/rules/${rule.id}/test/`, { method: "POST" });
      const { sent, events: n } = json as { sent: number; events: number };
      setNotice(
        sent
          ? `Test sent to ${sent} ${sent === 1 ? "address" : "addresses"}` +
              (n ? `, from the last day's ${n} ${n === 1 ? "event" : "events"}.` : ", with nothing from the last day to show.")
          : "No one to send a test to yet."
      );
    } catch (err) {
      setError(errMessage(err));
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Title title="Platform notifications" />
      <Typography variant="h4" gutterBottom>
        Platform notifications
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        What&apos;s happening across every organization: sign-ups, projects, speakers, contributions,
        publishing. You&apos;re never told about your own actions.
      </Typography>

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
      ) : (
        <Stack spacing={2}>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              events={events}
              tenants={tenants}
              onPatch={(body) => patch(rule, body)}
              onTest={() => test(rule)}
              onRemove={() => remove(rule)}
            />
          ))}
          <Box>
            <Button onClick={create}>Add a rule</Button>
          </Box>
          <RecentActivity rows={activity} />
        </Stack>
      )}
    </Container>
  );
};

interface CardProps {
  rule: Rule;
  events: EventInfo[];
  tenants: Tenant[];
  onPatch: (body: RulePatch) => void;
  onTest: () => void;
  onRemove: () => void;
}

const RuleCard: React.FC<CardProps> = ({ rule, events, tenants, onPatch, onTest, onRemove }) => {
  const [name, setName] = useState(rule.name);
  const [emailError, setEmailError] = useState<string | null>(null);
  useEffect(() => setName(rule.name), [rule.name]);

  const allSupers = rule.recipients.some((r) => r.kind === "superusers");
  const users = rule.recipients.filter((r) => r.kind === "user").map((r) => r.user_id!);
  const emails = rule.recipients.filter((r) => r.kind === "email").map((r) => r.email!);

  const saveRecipients = (next: { allSupers?: boolean; emails?: string[] }) =>
    onPatch({
      recipients: [
        ...((next.allSupers ?? allSupers) ? [{ kind: "superusers" as const }] : []),
        ...users.map((id) => ({ kind: "user" as const, user_id: id })),
        ...(next.emails ?? emails).map((e) => ({ kind: "email" as const, email: e })),
      ],
    });

  const toggleEvent = (key: string, on: boolean) =>
    onPatch({ events: on ? [...rule.events, key] : rule.events.filter((e) => e !== key) });

  const digest = rule.delivery !== "immediate";
  const excluded = useMemo(
    () => tenants.filter((t) => rule.exclude_tenant_ids.includes(t.id)),
    [tenants, rule.exclude_tenant_ids]
  );

  return (
    <Card variant="outlined" sx={{ opacity: rule.is_active ? 1 : 0.6 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label="Name"
            value={name}
            placeholder="e.g. Daily digest"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name !== rule.name && onPatch({ name })}
            sx={{ flex: 1, maxWidth: 320 }}
          />
          <Box sx={{ flex: 1 }} />
          <Tooltip title={rule.is_active ? "On" : "Off"}>
            <Switch
              checked={rule.is_active}
              onChange={(_e, on) => onPatch({ is_active: on })}
              slotProps={{ input: { "aria-label": "Send these notifications" } }}
            />
          </Tooltip>
          <Tooltip title="Delete this rule">
            <IconButton onClick={onRemove} aria-label="Delete">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
          When
        </Typography>
        <FormGroup sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {events.map((ev) => (
            <Tooltip key={ev.key} title={ev.description} placement="top-start">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rule.events.includes(ev.key)}
                    onChange={(_e, on) => toggleEvent(ev.key, on)}
                  />
                }
                label={ev.label}
              />
            </Tooltip>
          ))}
        </FormGroup>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          How
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Send"
            value={rule.delivery}
            onChange={(e) => onPatch({ delivery: e.target.value as Delivery })}
            sx={{ minWidth: 230 }}
          >
            {DELIVERIES.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>
          {rule.delivery === "weekly" && (
            <TextField
              select
              size="small"
              label="On"
              value={rule.weekday}
              onChange={(e) => onPatch({ weekday: Number(e.target.value) })}
              sx={{ minWidth: 140 }}
            >
              {WEEKDAYS.map((d, i) => (
                <MenuItem key={d} value={i}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          )}
          {(rule.delivery === "daily" || rule.delivery === "weekly") && (
            <TextField
              select
              size="small"
              label="At"
              value={rule.hour}
              onChange={(e) => onPatch({ hour: Number(e.target.value) })}
              sx={{ minWidth: 120 }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <MenuItem key={h} value={h}>
                  {hourLabel(h)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {digest && (
            <Autocomplete
              size="small"
              disableClearable
              options={TIMEZONES.includes(rule.timezone) ? TIMEZONES : [rule.timezone, ...TIMEZONES]}
              value={rule.timezone}
              onChange={(_e, tz) => tz && onPatch({ timezone: tz })}
              renderInput={(params) => <TextField {...params} label="Timezone" />}
              sx={{ minWidth: 240 }}
            />
          )}
        </Stack>
        {digest && rule.is_active && rule.next_digest_at && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Next digest {when(rule.next_digest_at, rule.timezone)}, if there&apos;s anything to say.
          </Typography>
        )}

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
          To
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={<Checkbox checked={allSupers} onChange={(_e, on) => saveRecipients({ allSupers: on })} />}
            label="Every superuser"
          />
          <Autocomplete
            multiple
            freeSolo
            autoSelect
            size="small"
            options={[] as string[]}
            value={emails}
            onChange={(_e, values) => {
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
              saveRecipients({ emails: Array.from(new Set(cleaned)) });
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
                helperText={emailError ?? "Each email lets them stop these."}
              />
            )}
          />
          <Autocomplete
            multiple
            size="small"
            options={tenants}
            getOptionLabel={(t) => t.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={excluded}
            onChange={(_e, picked) => onPatch({ exclude_tenant_ids: picked.map((t) => t.id) })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Leave out these organizations"
                helperText="Nothing from them at all, participants' contributions included."
              />
            )}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {rule.events.length === 0
              ? "Tick at least one event."
              : rule.reaches === 0
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

const RecentActivity: React.FC<{ rows: Activity[] }> = ({ rows }) => (
  <Box sx={{ pt: 2 }}>
    <Typography variant="h6" gutterBottom>
      Recent activity
    </Typography>
    {rows.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        Nothing yet. Sign-ups, projects, speakers, contributions and publishing show here as they happen.
      </Typography>
    ) : (
      <Table size="small">
        <TableBody>
          {rows.map((r) => {
            const q = r.data?.tenant_slug ? `?tenant=${r.data.tenant_slug}` : "";
            const where = r.project_id ? (
              <Link href={`/project/${r.project_id}${q}`}>{r.project_label || "A project"}</Link>
            ) : null;
            return (
              <TableRow key={r.id}>
                <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", width: "1%", verticalAlign: "top" }}>
                  {when(r.occurred_at)}
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  {r.summary}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {" — "}
                    {r.tenant_label || "No organization"}
                    {where && <> · {where}</>}
                    {r.actor_label && r.actor_label !== "a participant" && !r.summary.includes(r.actor_label)
                      ? ` · ${r.actor_label}`
                      : ""}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )}
  </Box>
);

export default PlatformNotificationsPage;
