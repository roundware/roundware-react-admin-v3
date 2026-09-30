// ---------------------------------------------------------------------------
// Plan — the tenant's plan, its usage against each limit, and switching.
// See roundware-server-v3 docs/013-quotas.md.
// ---------------------------------------------------------------------------
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Title, useNotify, usePermissions } from "react-admin";
import { contributionNotice, LimitBar, useUsage } from "../components/common/UsageMeter";
import {
  fetchPlans,
  formatPrice,
  PlanData,
  planFeatures,
  switchPlan,
  UNLIMITED,
  Usage,
} from "../utilities/plans";

/** The limits a plan would put this tenant over, as sentences. */
function wouldExceed(plan: PlanData, usage: Usage): string[] {
  const over: string[] = [];
  const check = (used: number, limit: number, what: string) => {
    if (limit !== UNLIMITED && used > limit)
      over.push(`${used.toLocaleString()} ${what}; ${plan.name} allows ${limit.toLocaleString()}`);
  };
  check(usage.projects.used, plan.max_projects, "projects");
  check(usage.contributions.used, plan.max_contributions, "contributions");
  check(usage.members.used, plan.max_members, "team members");
  return over;
}

const PlanPage = () => {
  const { permissions } = usePermissions();
  const canSwitch = permissions?.role === "owner" || permissions?.role === "superuser";
  const notify = useNotify();
  const { usage, reload } = useUsage();
  const [plans, setPlans] = useState<PlanData[] | null>(null);
  const [confirming, setConfirming] = useState<PlanData | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  if (!usage || !plans) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Title title="Plan" />
        <CircularProgress />
      </Box>
    );
  }

  const current = usage.plan;
  const notice = contributionNotice(usage);

  const doSwitch = async (plan: PlanData) => {
    setSwitching(true);
    try {
      await switchPlan(plan.id);
      notify(`Switched to ${plan.name}.`, { type: "success" });
      reload();
    } catch (e) {
      notify((e as Error)?.message || "Could not switch plan.", { type: "error" });
    } finally {
      setSwitching(false);
      setConfirming(null);
    }
  };

  // Moving to a plan the tenant is already over gets a word first; moving
  // anywhere else just happens.
  const choose = (plan: PlanData) =>
    wouldExceed(plan, usage).length ? setConfirming(plan) : doSwitch(plan);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 6, px: 2 }}>
      <Title title="Plan" />

      <Stack spacing={3}>
        {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}

        <Card>
          <CardHeader
            title={current ? `${current.name} plan` : "No plan"}
            subheader={
              current
                ? "Contributions are every asset and every speaker, pooled across all your projects."
                : "This organization has no plan, so nothing is limited."
            }
          />
          {current && (
            <CardContent>
              <Stack spacing={2.5}>
                <LimitBar label="Projects" value={usage.projects} />
                <LimitBar label="Contributions" value={usage.contributions} />
                <LimitBar label="Team members" value={usage.members} />
              </Stack>
            </CardContent>
          )}
        </Card>

        {!usage.billing_enabled && (
          <Alert severity="info">
            Billing isn&apos;t switched on yet, so every plan is free to choose and nothing is charged.
          </Alert>
        )}

        <Grid container spacing={2}>
          {plans.map((plan) => {
            const isCurrent = current?.id === plan.id;
            const { amount, period } = formatPrice(plan.price_cents_monthly);
            return (
              <Grid key={plan.id} size={{ xs: 12, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderColor: isCurrent ? "primary.main" : undefined,
                    borderWidth: isCurrent ? 2 : 1,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{plan.name}</Typography>
                      {isCurrent && <Chip label="Current plan" color="primary" size="small" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {amount} {period}
                    </Typography>
                    <Stack spacing={1}>
                      {planFeatures(plan).map((f) => (
                        <Typography key={f} variant="body2">
                          ✓ {f}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                  {!isCurrent && canSwitch && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled={switching}
                        onClick={() => choose(plan)}
                      >
                        Switch to {plan.name}
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {!canSwitch && (
          <Typography variant="body2" color="text.secondary">
            Only the organization&apos;s owner can change its plan.
          </Typography>
        )}
      </Stack>

      <Dialog open={!!confirming} onClose={() => setConfirming(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Switch to {confirming?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            You&apos;re already past this plan&apos;s limits:
          </Typography>
          {confirming &&
            wouldExceed(confirming, usage).map((line) => (
              <Typography key={line} variant="body2">
                • {line}
              </Typography>
            ))}
          <Typography variant="body2" sx={{ mt: 2 }}>
            Nothing is deleted, but you won&apos;t be able to add more until you&apos;re back under
            them, and published projects may pause contributions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={switching}
            onClick={() => confirming && doSwitch(confirming)}
          >
            Switch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanPage;
