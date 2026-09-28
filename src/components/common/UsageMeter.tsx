import { Alert, Box, LinearProgress, Link, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  formatLimit,
  LimitUsage,
  meterColor,
  percentUsed,
  Usage,
  fetchUsage,
} from "../../utilities/plans";

/** The tenant's usage against its plan, or null until loaded (or if it fails). */
export function useUsage(): { usage: Usage | null; reload: () => void } {
  const [usage, setUsage] = useState<Usage | null>(null);
  const reload = useCallback(() => {
    fetchUsage()
      .then(setUsage)
      .catch(() => setUsage(null)); // A meter is a courtesy; never block the page on it.
  }, []);
  useEffect(reload, [reload]);
  return { usage, reload };
}

/** One labelled bar: "Contributions  412 / 2,000". Unlimited shows no bar. */
export const LimitBar = ({ label, value }: { label: string; value: LimitUsage }) => {
  const pct = percentUsed(value);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {value.used.toLocaleString()} / {formatLimit(value.limit)}
        </Typography>
      </Stack>
      {pct !== null && (
        <LinearProgress
          variant="determinate"
          value={Math.min(pct, 100)}
          color={meterColor(pct)}
          sx={{ height: 8, borderRadius: 4 }}
        />
      )}
    </Box>
  );
};

/** What the contribution count means right now, or null when there is nothing to say. */
export function contributionNotice(usage: Usage): { severity: "warning" | "error"; text: string } | null {
  const c = usage.contributions;
  if (c.limit === -1) return null;
  if (!c.open) {
    return {
      severity: "error",
      text:
        "Contributions are paused. Your published projects have stopped offering " +
        "to record. Choose a larger plan, or delete some contributions, to reopen them.",
    };
  }
  if (c.used >= c.limit) {
    return {
      severity: "warning",
      text:
        `You've reached your plan's ${c.limit.toLocaleString()} contributions. ` +
        `Participants can keep contributing up to ${c.pause_at?.toLocaleString()}, ` +
        "then your projects pause; you can't add more in the admin.",
    };
  }
  return null;
}

/**
 * Compact contributions meter with a link to the Plan page, for the
 * dashboard and Customize & Publish. Renders nothing for a tenant without
 * limits, or until usage has loaded.
 */
const UsageMeter = () => {
  const { usage } = useUsage();
  if (!usage || usage.contributions.limit === -1) return null;
  const notice = contributionNotice(usage);

  return (
    <Stack spacing={1}>
      <LimitBar label="Contributions (assets and speakers)" value={usage.contributions} />
      {notice && (
        <Alert severity={notice.severity} sx={{ py: 0 }}>
          {notice.text}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {usage.plan?.name} plan ·{" "}
        <Link component={RouterLink} to="/plan">
          See plan and usage
        </Link>
      </Typography>
    </Stack>
  );
};

export default UsageMeter;
