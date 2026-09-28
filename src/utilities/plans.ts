// ---------------------------------------------------------------------------
// Plans and usage — shared by onboarding, the Plan page and the usage meters.
// See roundware-server-v3 docs/013-quotas.md.
// ---------------------------------------------------------------------------
import { apiFetcher } from "../roundwareDataProvider/tokenAuthProvider";

/** -1 means unlimited, for every limit. */
export const UNLIMITED = -1;

export interface PlanData {
  id: number;
  name: string;
  max_projects: number;
  /** One pool per tenant: every asset plus every speaker, across projects. */
  max_contributions: number;
  max_storage_mb: number;
  max_recording_length_sec: number;
  max_members: number;
  price_cents_monthly: number;
}

export interface LimitUsage {
  used: number;
  limit: number;
}

export interface Usage {
  /** Null for a tenant with no subscription, which has no limits. */
  plan: PlanData | null;
  projects: LimitUsage;
  contributions: LimitUsage & {
    /** Where published projects stop offering to record (limit + 10%). */
    pause_at: number | null;
    open: boolean;
  };
  members: LimitUsage;
  /** While false, any plan can be chosen and nothing is charged. */
  billing_enabled: boolean;
}

export async function fetchUsage(): Promise<Usage> {
  const { json } = await apiFetcher("/billing/usage/");
  return json as Usage;
}

export async function fetchPlans(): Promise<PlanData[]> {
  const { json } = await apiFetcher("/billing/plans/");
  return json as PlanData[];
}

export async function switchPlan(planId: number): Promise<void> {
  await apiFetcher("/billing/subscription/", {
    method: "PATCH",
    body: JSON.stringify({ plan_id: planId }),
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}

/** Share of the limit used, 0–100+; null when unlimited. */
export function percentUsed({ used, limit }: LimitUsage): number | null {
  if (limit === UNLIMITED) return null;
  if (limit === 0) return used > 0 ? 100 : 0;
  return (used / limit) * 100;
}

/** Amber from 80%, red from 100% (docs/013 §4). */
export function meterColor(pct: number | null): "primary" | "warning" | "error" {
  if (pct === null || pct < 80) return "primary";
  return pct < 100 ? "warning" : "error";
}

export function formatLimit(n: number): string {
  return n === UNLIMITED ? "unlimited" : n.toLocaleString();
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

/** Human-readable feature list for a plan. */
export function planFeatures(p: PlanData): string[] {
  return [
    p.max_projects === UNLIMITED ? "Unlimited projects" : plural(p.max_projects, "project"),
    p.max_contributions === UNLIMITED
      ? "Unlimited contributions"
      : `${plural(p.max_contributions, "contribution")}, across all projects`,
    p.max_members === UNLIMITED ? "Unlimited team members" : plural(p.max_members, "team member"),
  ];
}

export function formatPrice(cents: number): { amount: string; period: string } {
  if (cents === 0) return { amount: "$0", period: "forever" };
  return { amount: `$${Math.round(cents / 100)}`, period: "/month" };
}
