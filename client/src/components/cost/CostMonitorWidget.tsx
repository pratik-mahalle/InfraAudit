import { useMemo } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, BellRing, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { useCostMonitors } from "@/hooks/use-costs";
import { useCostMonitorIncidents, useCostNotificationChannels } from "@/hooks/use-cost-notifications";
import type { CostMonitor, CostMonitorStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  costMonitorProgress,
  costMonitorScope,
  costMonitorStatusRank,
  costMonitorStatusStyle,
  costMonitorTypeLabel,
  formatCostMonitorMetric,
} from "./cost-monitor-utils";

interface CostMonitorWidgetProps {
  provider?: string;
  accountId?: string;
  layout?: "compact" | "wide";
  className?: string;
}

const attentionStatuses = new Set<CostMonitorStatus>(["critical", "warning", "stale", "error"]);

function relativeTime(value?: string) {
  if (!value) return "Not scheduled";
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : formatDistanceToNow(date, { addSuffix: true });
}

function scopeDescription(provider?: string, accountId?: string) {
  if (accountId) return `${provider?.toUpperCase() ?? "Cloud"} account ${accountId}`;
  if (provider) return `All ${provider.toUpperCase()} billing accounts`;
  return "All connected cloud billing scopes";
}

export function CostMonitorWidget({ provider, accountId, layout = "compact", className }: CostMonitorWidgetProps) {
  const monitorsQuery = useCostMonitors(100, 0, true);
  const channelsQuery = useCostNotificationChannels();
  const incidentsQuery = useCostMonitorIncidents({ limit: 20 });
  const monitors = useMemo(() => {
    const scoped = (monitorsQuery.data?.monitors ?? []).filter((monitor) => {
      if (provider && monitor.provider !== provider) return false;
      if (accountId && monitor.cloudAccountId && monitor.cloudAccountId !== accountId) return false;
      return true;
    });
    return scoped.sort((left, right) => {
      const rank = costMonitorStatusRank[left.status] - costMonitorStatusRank[right.status];
      if (rank !== 0) return rank;
      return left.name.localeCompare(right.name);
    });
  }, [accountId, monitorsQuery.data?.monitors, provider]);

  const attention = monitors.filter((monitor) => attentionStatuses.has(monitor.status));
  const healthy = monitors.filter((monitor) => monitor.status === "healthy").length;
  const visibleMonitors = monitors.slice(0, layout === "wide" ? 3 : 2);
  const nextEvaluation = monitors
    .map((monitor) => monitor.nextEvaluationAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0];
  const activeChannels = (channelsQuery.data?.channels ?? []).filter((channel) => channel.enabled && channel.deliveryReady).length;
  const activeIncidents = (incidentsQuery.data?.incidents ?? []).filter((incident) => {
    if (incident.status === "resolved") return false;
    if (provider && incident.provider !== provider) return false;
    if (accountId && incident.cloudAccountId && incident.cloudAccountId !== accountId) return false;
    return true;
  });
  const latestIncident = activeIncidents[0];

  return (
    <Card className={cn("overflow-hidden", className, attention.length > 0 && "border-amber-500/40")}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4 text-primary" /> Cost guardrails
            </CardTitle>
            <CardDescription className="mt-1">
              {scopeDescription(provider, accountId)} · evaluated after scheduled cost imports · {channelsQuery.isError ? "delivery health unavailable" : `${activeChannels} delivery channel${activeChannels === 1 ? "" : "s"} active`}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/cost-monitors">Manage monitors <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {monitorsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" />
          </div>
        ) : monitorsQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div><p className="text-sm font-medium">Monitor status could not be loaded</p><p className="text-xs text-muted-foreground">Cost history remains available, but threshold health is unknown.</p></div>
            </div>
            <Button variant="outline" size="sm" onClick={() => monitorsQuery.refetch()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button>
          </div>
        ) : monitors.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-7 text-center">
            <BellRing className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No enabled monitor covers this scope</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a budget, daily-spend, run-rate, rolling-window, or period-change guardrail.</p>
            <Button asChild size="sm" className="mt-4"><Link href="/cost-monitors">Create a monitor</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Enabled in scope</p><p className="mt-1 text-xl font-semibold">{monitors.length}</p></div>
              <div className={cn("rounded-lg border p-3", activeIncidents.length > 0 && "border-red-500/40 bg-red-500/5")}><p className="text-xs text-muted-foreground">Active breaches</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold">{activeIncidents.length > 0 ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}{activeIncidents.length}</p><p className="mt-1 text-xs text-muted-foreground">{attention.length} monitors need attention</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Delivery channels</p><p className="mt-1 text-xl font-semibold">{channelsQuery.isError ? "—" : activeChannels}</p><p className="mt-1 text-xs text-muted-foreground">Slack, email, or webhook</p></div>
              <div className="rounded-lg border p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Next evaluation</p><p className="mt-1 text-sm font-semibold">{relativeTime(nextEvaluation)}</p><p className="mt-1 text-xs text-muted-foreground">{healthy} healthy</p></div>
            </div>

            {latestIncident && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <div><p className="text-sm font-semibold">{latestIncident.monitorName}</p><p className="text-xs text-muted-foreground"><span className="capitalize">{latestIncident.severity}</span> breach · escalation level {latestIncident.escalationLevel} · {latestIncident.status === "acknowledged" ? "acknowledged" : "awaiting acknowledgement"}</p></div>
                <Button asChild variant="outline" size="sm"><Link href="/cost-monitors">Open incident <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>
              </div>
            )}

            <div className={cn("grid gap-3", layout === "wide" && "lg:grid-cols-3")}>
              {visibleMonitors.map((monitor) => <MonitorSnapshot key={monitor.id} monitor={monitor} />)}
            </div>

            {monitors.length > visibleMonitors.length && (
              <p className="text-xs text-muted-foreground">Showing the highest-priority {visibleMonitors.length} of {monitors.length} enabled monitors.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MonitorSnapshot({ monitor }: { monitor: CostMonitor }) {
  const progress = costMonitorProgress(monitor);
  const barColor = monitor.status === "critical" || monitor.status === "error"
    ? "bg-red-500"
    : monitor.status === "warning" || monitor.status === "stale"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{monitor.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{costMonitorTypeLabel(monitor.monitorType)}</p></div>
        <Badge variant="outline" className={cn("shrink-0 capitalize", costMonitorStatusStyle[monitor.status])}>{monitor.status}</Badge>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 text-xs">
        <div><p className="text-muted-foreground">Observed</p><p className="text-sm font-semibold">{formatCostMonitorMetric(monitor.latestValue, monitor)}</p></div>
        <div className="text-right"><p className="text-muted-foreground">Threshold</p><p className="font-medium">{formatCostMonitorMetric(monitor.threshold, monitor)}</p></div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", barColor)} style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">{costMonitorScope(monitor)}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Evaluated {relativeTime(monitor.lastEvaluatedAt)}</p>
      {monitor.lastError && <p className="mt-2 line-clamp-2 text-xs text-orange-600 dark:text-orange-400">{monitor.lastError}</p>}
    </div>
  );
}
