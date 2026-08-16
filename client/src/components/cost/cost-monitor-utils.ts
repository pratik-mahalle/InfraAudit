import type { CostMonitor, CostMonitorStatus, CostMonitorType } from "@/types";

export const costMonitorTypes: { value: CostMonitorType; label: string; description: string }[] = [
  { value: "monthly_budget", label: "Monthly budget", description: "Current month actual spend" },
  { value: "daily_spend", label: "Daily spend", description: "Latest available billing day" },
  { value: "rolling_spend", label: "Rolling spend", description: "Spend over a configurable day window" },
  { value: "monthly_forecast", label: "Monthly forecast", description: "Evidence-backed run-rate projection" },
  { value: "month_over_month", label: "Period change", description: "Percent change against an equal prior period" },
];

export const costMonitorStatusStyle: Record<CostMonitorStatus, string> = {
  pending: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  healthy: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  critical: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  stale: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  error: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
};

export const costMonitorStatusRank: Record<CostMonitorStatus, number> = {
  critical: 0,
  warning: 1,
  error: 2,
  stale: 3,
  pending: 4,
  healthy: 5,
};

export function costMonitorTypeLabel(type: CostMonitorType) {
  return costMonitorTypes.find((item) => item.value === type)?.label ?? type.replaceAll("_", " ");
}

export function formatCostMonitorMetric(value: number, monitor: Pick<CostMonitor, "monitorType" | "currency">) {
  if (monitor.monitorType === "month_over_month") return `${value.toFixed(1)}%`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: monitor.currency,
      maximumFractionDigits: Math.abs(value) > 0 && Math.abs(value) < 1 ? 4 : 2,
    }).format(value);
  } catch {
    return `${monitor.currency} ${value.toFixed(2)}`;
  }
}

export function costMonitorProgress(monitor: Pick<CostMonitor, "latestValue" | "threshold">) {
  if (monitor.threshold <= 0) return 0;
  return Math.max(0, Math.min(100, (monitor.latestValue / monitor.threshold) * 100));
}

export function costMonitorScope(monitor: Pick<CostMonitor, "provider" | "cloudAccountId" | "serviceName" | "region">) {
  const parts = [
    monitor.provider.toUpperCase(),
    monitor.cloudAccountId || "all accounts",
    monitor.serviceName || "all services",
    monitor.region || "all regions",
  ];
  return parts.join(" · ");
}
