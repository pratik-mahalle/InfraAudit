import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BellRing,
  Bug,
  CheckCircle2,
  Cloud,
  ExternalLink,
  GitCompareArrows,
  Loader2,
  Network,
  Radar,
  Shield,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from "@/hooks/use-alerts";
import { useAcknowledgeDrift, useApproveDriftAsBaseline, useDrifts, useResolveDrift, useTriggerDriftDetection } from "@/hooks/use-drifts";
import { useResources } from "@/hooks/use-resources";
import { useTriggerVulnerabilityScan, useVulnerabilities } from "@/hooks/use-vulnerabilities";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Alert, Drift, Vulnerability } from "@/lib/api";
import { DetailRow, EmptyPanel, ToneBadge } from "@/components/security-ops/ops-ui";
import { useToast } from "@/hooks/use-toast";

function riskWeight(severity: string) {
  if (severity === "critical") return 10;
  if (severity === "high") return 6;
  if (severity === "medium") return 3;
  if (severity === "low") return 1;
  return 0;
}

function resourceName(resources: Array<{ id?: number; resourceId?: string; name: string }>, id?: number | string) {
  if (!id) return "No resource linked";
  return resources.find((resource) => resource.id === id || resource.resourceId === String(id))?.name ?? `Resource ${id}`;
}

function pct(closed: number, total: number) {
  return total ? Math.round((closed / total) * 100) : 100;
}

export default function SecurityMonitoring({ defaultTab = "risk" }: { defaultTab?: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState(defaultTab === "alerts" ? "Alerts" : defaultTab === "drifts" ? "Drift" : "All");

  const { data: alertsResponse, isLoading: alertsLoading } = useAlerts();
  const { data: driftsResponse, isLoading: driftsLoading } = useDrifts();
  const { data: vulnerabilitiesResponse, isLoading: vulnerabilitiesLoading } = useVulnerabilities();
  const { data: resourcesResponse } = useResources();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const acknowledgeDrift = useAcknowledgeDrift();
  const resolveDrift = useResolveDrift();
  const approveDrift = useApproveDriftAsBaseline();
  const triggerDriftDetection = useTriggerDriftDetection();
  const triggerVulnerabilityScan = useTriggerVulnerabilityScan();

  const alerts: Alert[] = alertsResponse?.data ?? [];
  const drifts: Drift[] = Array.isArray(driftsResponse) ? driftsResponse : driftsResponse?.data ?? [];
  const vulnerabilities: Vulnerability[] = Array.isArray(vulnerabilitiesResponse) ? vulnerabilitiesResponse : vulnerabilitiesResponse?.data ?? [];
  const resources = resourcesResponse?.data ?? [];

  const openAlerts = alerts.filter((alert) => alert.status !== "resolved");
  const openDrifts = drifts.filter((drift) => drift.status === "detected" || drift.status === "acknowledged");
  const openVulnerabilities = vulnerabilities.filter((vulnerability) => vulnerability.status === "open");

  const securityScore = useMemo(() => {
    const totalRisk =
      openAlerts.reduce((sum, alert) => sum + riskWeight(alert.severity), 0) +
      openDrifts.reduce((sum, drift) => sum + riskWeight(drift.severity), 0) +
      openVulnerabilities.reduce((sum, vulnerability) => sum + riskWeight(vulnerability.severity), 0);
    return Math.max(0, 100 - Math.min(100, totalRisk));
  }, [openAlerts, openDrifts, openVulnerabilities]);

  const priorityItems = [
    ...openAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.message,
      severity: alert.severity,
      type: "Alert",
      route: "/alerts",
      time: alert.createdAt,
      resource: resourceName(resources, alert.resourceId),
      raw: alert,
    })),
    ...openDrifts.map((drift) => ({
      id: `drift-${drift.id}`,
      title: drift.driftType.replace(/_/g, " "),
      description: drift.description,
      severity: drift.severity,
      type: "Drift",
      route: "/drift-detection",
      time: drift.detectedAt,
      resource: drift.resourceIdStr || resourceName(resources, drift.resourceId),
      raw: drift,
    })),
    ...openVulnerabilities.map((vulnerability) => ({
      id: `vuln-${vulnerability.id}`,
      title: vulnerability.title,
      description: vulnerability.description,
      severity: vulnerability.severity,
      type: "Vulnerability",
      route: "/vulnerabilities",
      time: vulnerability.detectedAt,
      resource: resourceName(resources, vulnerability.resourceId),
      raw: vulnerability,
    })),
  ].sort((a, b) => riskWeight(b.severity) - riskWeight(a.severity));

  const streamItems = priorityItems.filter((item) => activeStream === "All" || item.type === activeStream).slice(0, 12);
  const selectedItem = priorityItems.find((item) => item.id === selectedItemId) ?? streamItems[0] ?? priorityItems[0] ?? null;
  const loading = alertsLoading || driftsLoading || vulnerabilitiesLoading;
  const alertClosure = pct(alerts.filter((alert) => alert.status === "resolved").length, alerts.length);
  const driftClosure = pct(drifts.filter((drift) => drift.status === "resolved" || drift.status === "approved").length, drifts.length);
  const vulnerabilityClosure = pct(vulnerabilities.filter((vulnerability) => vulnerability.status === "fixed").length, vulnerabilities.length);
  const criticalOpen = priorityItems.filter((item) => item.severity === "critical").length;
  const highOpen = priorityItems.filter((item) => item.severity === "high").length;

  const resourceRisk = resources.map((resource) => {
    const rid = String(resource.id ?? resource.resourceId ?? "");
    const score =
      openAlerts.filter((alert) => String(alert.resourceId ?? "") === rid).reduce((sum, alert) => sum + riskWeight(alert.severity), 0) +
      openDrifts.filter((drift) => String(drift.resourceId) === rid || drift.resourceIdStr === resource.resourceId).reduce((sum, drift) => sum + riskWeight(drift.severity), 0) +
      openVulnerabilities.filter((vulnerability) => String(vulnerability.resourceId ?? "") === rid).reduce((sum, vulnerability) => sum + riskWeight(vulnerability.severity), 0);
    return { resource, score };
  }).sort((a, b) => b.score - a.score).slice(0, 10);

  const sourceMix = [
    { label: "Alert", route: "/alerts", open: openAlerts.length, total: alerts.length, icon: BellRing, tone: "red" as const },
    { label: "Drift", route: "/drift-detection", open: openDrifts.length, total: drifts.length, icon: GitCompareArrows, tone: "amber" as const },
    { label: "Vulnerability", route: "/vulnerabilities", open: openVulnerabilities.length, total: vulnerabilities.length, icon: Bug, tone: "orange" as const },
  ];

  const runDriftScan = () => {
    triggerDriftDetection.mutate(undefined, {
      onSuccess: (result) => toast({
        title: result.jobId ? "Drift scan queued" : "Drift scan started",
        description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking resource configuration drift.",
      }),
      onError: (error: Error) => toast({ title: "Could not start drift scan", description: error.message, variant: "destructive" }),
    });
  };

  const runVulnerabilityScan = () => {
    triggerVulnerabilityScan.mutate(undefined, {
      onSuccess: (result) => toast({
        title: result.jobId ? "Vulnerability scan queued" : "Vulnerability scan started",
        description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking vulnerable packages and resources.",
      }),
      onError: (error: Error) => toast({ title: "Could not start vulnerability scan", description: error.message, variant: "destructive" }),
    });
  };

  const handlePrimaryAction = () => {
    if (!selectedItem) return;
    if (selectedItem.type === "Alert") {
      resolveAlert.mutate((selectedItem.raw as Alert).id, {
        onSuccess: () => toast({ title: "Alert resolved", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not resolve alert", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Drift") {
      resolveDrift.mutate((selectedItem.raw as Drift).id, {
        onSuccess: () => toast({ title: "Drift resolved", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not resolve drift", description: error.message, variant: "destructive" }),
      });
    } else {
      navigate("/vulnerabilities");
    }
  };

  const handleSecondaryAction = () => {
    if (!selectedItem) return;
    if (selectedItem.type === "Alert") {
      acknowledgeAlert.mutate((selectedItem.raw as Alert).id, {
        onSuccess: () => toast({ title: "Alert acknowledged", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not acknowledge alert", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Drift") {
      acknowledgeDrift.mutate((selectedItem.raw as Drift).id, {
        onSuccess: () => toast({ title: "Drift acknowledged", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not acknowledge drift", description: error.message, variant: "destructive" }),
      });
    } else {
      navigate("/findings");
    }
  };

  const handleApproveBaseline = () => {
    if (!selectedItem || selectedItem.type !== "Drift") return;
    approveDrift.mutate((selectedItem.raw as Drift).id, {
      onSuccess: () => toast({ title: "Baseline approved", description: selectedItem.title }),
      onError: (error: Error) => toast({ title: "Could not approve baseline", description: error.message, variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-5 overflow-hidden rounded-xl border bg-card">
        <div className="grid xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="border-b p-5 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-24 w-24 items-center justify-center rounded-full border-8", securityScore >= 80 ? "border-emerald-500/30" : securityScore >= 50 ? "border-amber-500/30" : "border-red-500/30")}>
                <div className="text-center">
                  <p className="text-3xl font-semibold">{securityScore}</p>
                  <p className="text-[11px] uppercase text-muted-foreground">score</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Command center</p>
                <h1 className="text-2xl font-semibold">Security Operations</h1>
                <p className="mt-1 text-sm text-muted-foreground">{priorityItems.length} active work items</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x border-b xl:border-b-0 xl:border-r lg:grid-cols-4">
            {[
              { label: "Critical", value: criticalOpen, tone: "red" as const },
              { label: "High", value: highOpen, tone: "orange" as const },
              { label: "Assets", value: resources.length, tone: "blue" as const },
              { label: "Open", value: priorityItems.length, tone: "amber" as const },
            ].map((item) => (
              <div key={item.label} className="p-5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                <ToneBadge value={item.label} tone={item.tone} />
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center gap-2 p-5">
            <Button className="gap-2" onClick={runVulnerabilityScan} disabled={triggerVulnerabilityScan.isPending}>
              {triggerVulnerabilityScan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
              Run Vulnerability Scan
            </Button>
            <Button variant="outline" className="gap-2" onClick={runDriftScan} disabled={triggerDriftDetection.isPending}>
              {triggerDriftDetection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
              Run Drift Scan
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[760px] overflow-hidden rounded-xl border bg-card xl:grid-cols-[280px_minmax(0,1fr)_430px]">
        <aside className="border-b bg-muted/20 xl:border-b-0 xl:border-r">
          <div className="border-b p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Radar className="h-4 w-4" />
              Live Streams
            </div>
          </div>
          <div className="divide-y">
            <button type="button" onClick={() => setActiveStream("All")} className={cn("flex w-full items-center justify-between px-4 py-4 text-left hover:bg-muted/60", activeStream === "All" && "bg-background")}>
              <span className="text-sm font-medium">All Work</span>
              <ToneBadge value={priorityItems.length} tone="slate" />
            </button>
            {sourceMix.map((source) => (
              <button
                key={source.label}
                type="button"
                onClick={() => setActiveStream(source.label)}
                className={cn("flex w-full items-center justify-between px-4 py-4 text-left hover:bg-muted/60", activeStream === source.label && "bg-background")}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <source.icon className="h-4 w-4" />
                  {source.label}
                </span>
                <ToneBadge value={source.open} tone={source.tone} />
              </button>
            ))}
          </div>
          <div className="space-y-5 p-4">
            <div>
              <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Closure</p>
              {[
                { label: "Alerts", value: alertClosure },
                { label: "Drift", value: driftClosure },
                { label: "Vulnerabilities", value: vulnerabilityClosure },
              ].map((item) => (
                <div key={item.label} className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <Progress value={item.value} />
                </div>
              ))}
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Route shortcuts</p>
              <div className="grid gap-2">
                {sourceMix.map((source) => (
                  <Button key={source.label} variant="outline" size="sm" className="justify-between" onClick={() => navigate(source.route)}>
                    {source.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 border-b xl:border-b-0 xl:border-r">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">{activeStream} Priority Timeline</h2>
            <p className="text-xs text-muted-foreground">Sorted by severity weight across alerts, drift, and vulnerabilities</p>
          </div>
          <div className="max-h-[790px] overflow-auto">
            {loading ? (
              <EmptyPanel icon={Shield} title="Loading security state" description="Collecting alerts, drifts, vulnerability findings, and asset context." />
            ) : streamItems.length === 0 ? (
              <EmptyPanel icon={CheckCircle2} title="No active security work" description="This stream has no unresolved items right now." />
            ) : (
              streamItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn("grid w-full gap-3 border-b px-4 py-4 text-left transition-colors hover:bg-muted/50 lg:grid-cols-[52px_minmax(0,1fr)_150px]", selectedItem?.id === item.id && "bg-primary/5")}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-semibold">{index + 1}</div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <ToneBadge value={item.severity} />
                      <ToneBadge value={item.type} tone="blue" />
                    </div>
                    <h3 className="truncate text-sm font-semibold capitalize">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{item.resource}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 lg:justify-end">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(item.time)}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </main>

        <section className="min-w-0">
          <div className="border-b px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Workflow className="h-4 w-4" />
              Response Play
            </h2>
            <p className="text-xs text-muted-foreground">Current item context and primary actions</p>
          </div>
          <div className="max-h-[790px] overflow-auto p-4">
            {!selectedItem ? (
              <EmptyPanel icon={Shield} title="No active item" description="No unresolved alert, drift, or vulnerability is currently selected." />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <ToneBadge value={selectedItem.severity} />
                    <ToneBadge value={selectedItem.type} tone="blue" />
                  </div>
                  <h3 className="text-lg font-semibold capitalize">{selectedItem.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Resource">{selectedItem.resource}</DetailRow>
                  <DetailRow label="Detected">{formatTimeAgo(selectedItem.time)}</DetailRow>
                  <DetailRow label="Workflow">{selectedItem.route.replace("/", "")}</DetailRow>
                  <DetailRow label="Risk Weight">{riskWeight(selectedItem.severity)}</DetailRow>
                </dl>
                <div className="grid gap-2">
                  <Button className="gap-2" onClick={handlePrimaryAction} disabled={resolveAlert.isPending || resolveDrift.isPending}>
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedItem.type === "Vulnerability" ? "Open Patch Center" : "Resolve"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleSecondaryAction} disabled={acknowledgeAlert.isPending || acknowledgeDrift.isPending}>
                    <Shield className="h-4 w-4" />
                    {selectedItem.type === "Vulnerability" ? "Find Related" : "Acknowledge"}
                  </Button>
                  {selectedItem.type === "Drift" && (
                    <Button variant="outline" className="gap-2" onClick={handleApproveBaseline} disabled={approveDrift.isPending}>
                      <Network className="h-4 w-4" />
                      Approve Baseline
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">At-risk resources</p>
                  <div className="space-y-2">
                    {resourceRisk.slice(0, 5).map(({ resource, score }) => (
                      <button
                        key={resource.id ?? resource.resourceId ?? resource.name}
                        type="button"
                        onClick={() => navigate(`/resources/${encodeURIComponent(String(resource.id ?? resource.resourceId ?? ""))}`)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{resource.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{resource.provider.toUpperCase()} · {resource.type}</span>
                        </span>
                        <ToneBadge value={score} tone={score >= 10 ? "red" : score >= 6 ? "orange" : score > 0 ? "amber" : "emerald"} />
                      </button>
                    ))}
                    {resourceRisk.length === 0 && <p className="text-sm text-muted-foreground">No resource concentration available yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
