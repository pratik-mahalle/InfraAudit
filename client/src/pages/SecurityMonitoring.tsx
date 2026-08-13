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
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from "@/hooks/use-alerts";
import { useAcknowledgeDrift, useApproveDriftAsBaseline, useDrifts, useResolveDrift, useTriggerDriftDetection } from "@/hooks/use-drifts";
import { useResources } from "@/hooks/use-resources";
import { useTriggerVulnerabilityScan, useVulnerabilities } from "@/hooks/use-vulnerabilities";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Alert, Drift, Vulnerability } from "@/lib/api";
import { DetailRow, EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
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

export default function SecurityMonitoring({ defaultTab = "risk" }: { defaultTab?: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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
  ].sort((a, b) => riskWeight(b.severity) - riskWeight(a.severity)).slice(0, 8);
  const selectedItem = priorityItems.find((item) => item.id === selectedItemId) ?? priorityItems[0] ?? null;

  const criticalCount = priorityItems.filter((item) => item.severity === "critical").length;
  const highCount = priorityItems.filter((item) => item.severity === "high").length;
  const loading = alertsLoading || driftsLoading || vulnerabilitiesLoading;

  const driftCoverage = drifts.length ? Math.round((drifts.filter((drift) => drift.status === "resolved" || drift.status === "approved").length / drifts.length) * 100) : 100;
  const vulnerabilityClosure = vulnerabilities.length ? Math.round((vulnerabilities.filter((vulnerability) => vulnerability.status === "fixed").length / vulnerabilities.length) * 100) : 100;
  const alertClosure = alerts.length ? Math.round((alerts.filter((alert) => alert.status === "resolved").length / alerts.length) * 100) : 100;
  const resourceRisk = resources.map((resource) => {
    const rid = String(resource.id ?? resource.resourceId ?? "");
    const score =
      openAlerts.filter((alert) => String(alert.resourceId ?? "") === rid).reduce((sum, alert) => sum + riskWeight(alert.severity), 0) +
      openDrifts.filter((drift) => String(drift.resourceId) === rid || drift.resourceIdStr === resource.resourceId).reduce((sum, drift) => sum + riskWeight(drift.severity), 0) +
      openVulnerabilities.filter((vulnerability) => String(vulnerability.resourceId ?? "") === rid).reduce((sum, vulnerability) => sum + riskWeight(vulnerability.severity), 0);
    return { resource, score };
  }).sort((a, b) => b.score - a.score).slice(0, 6);
  const sourceMix = [
    { label: "Alerts", open: openAlerts.length, total: alerts.length, tone: "red" as const },
    { label: "Drift", open: openDrifts.length, total: drifts.length, tone: "amber" as const },
    { label: "Vulnerabilities", open: openVulnerabilities.length, total: vulnerabilities.length, tone: "orange" as const },
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
      <PageHeader
        title="Security Dashboard"
        description="One place to see active infrastructure risk, ownership context, and response progress."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/alerts")}>
              <BellRing className="h-4 w-4" />
              Alert Inbox
            </Button>
            <Button variant="outline" className="gap-2" onClick={runDriftScan} disabled={triggerDriftDetection.isPending}>
              {triggerDriftDetection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
              Run Drift Scan
            </Button>
            <Button className="gap-2" onClick={runVulnerabilityScan} disabled={triggerVulnerabilityScan.isPending}>
              {triggerVulnerabilityScan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
              Run Vuln Scan
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Security Posture</CardTitle>
            <CardDescription>Weighted from unresolved alerts, drifts, and vulnerabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full border bg-muted/30">
                <div className="text-center">
                  <div className="text-4xl font-semibold">{securityScore}</div>
                  <div className="text-xs text-muted-foreground">score</div>
                </div>
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <MetricTile icon={ShieldAlert} label="Critical" value={criticalCount} tone="red" helper="Across queues" />
                <MetricTile icon={AlertTriangle} label="High" value={highCount} tone="orange" helper="Needs planning" />
                <MetricTile icon={Cloud} label="Resources" value={resources.length} tone="blue" helper="Observed assets" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Response Coverage</CardTitle>
            <CardDescription>Closure rate by security workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Alert closure", value: alertClosure },
              { label: "Drift baseline", value: driftCoverage },
              { label: "Vulnerability fixes", value: vulnerabilityClosure },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricTile icon={BellRing} label="Unresolved alerts" value={openAlerts.length} tone="red" helper={`${alerts.length} total`} />
        <MetricTile icon={GitCompareArrows} label="Open drift" value={openDrifts.length} tone="amber" helper="Detected or acknowledged" />
        <MetricTile icon={Bug} label="Open vulnerabilities" value={openVulnerabilities.length} tone="orange" helper="Awaiting fix" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Exposure Map
            </CardTitle>
            <CardDescription>Where active risk is concentrated by signal source and asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {sourceMix.map((source) => (
                <div key={source.label} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{source.label}</p>
                    <ToneBadge value={source.open} tone={source.tone} />
                  </div>
                  <Progress className="mt-3" value={source.total ? Math.round((source.open / source.total) * 100) : 0} />
                  <p className="mt-2 text-xs text-muted-foreground">{source.open} open of {source.total} total</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {resourceRisk.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No resource risk concentration available yet.</p>
              ) : (
                resourceRisk.map(({ resource, score }) => (
                  <button
                    key={resource.id ?? resource.resourceId ?? resource.name}
                    type="button"
                    onClick={() => navigate(`/resources/${encodeURIComponent(String(resource.id ?? resource.resourceId ?? ""))}`)}
                    className="grid gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_120px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{resource.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{resource.provider.toUpperCase()} · {resource.type} · {resource.region}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-xs text-muted-foreground">risk</span>
                      <ToneBadge value={score} tone={score >= 10 ? "red" : score >= 6 ? "orange" : score > 0 ? "amber" : "emerald"} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Response Play
            </CardTitle>
            <CardDescription>{selectedItem ? "Actions and context for the selected priority item" : "Select an item from the priority queue"}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <EmptyPanel icon={Shield} title="No active item" description="No unresolved alert, drift, or vulnerability is currently selected." />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <ToneBadge value={selectedItem.severity} />
                    <ToneBadge value={selectedItem.type} tone="blue" />
                  </div>
                  <h3 className="text-base font-semibold capitalize">{selectedItem.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Resource">{selectedItem.resource}</DetailRow>
                  <DetailRow label="Detected">{formatTimeAgo(selectedItem.time)}</DetailRow>
                  <DetailRow label="Workflow">{selectedItem.route.replace("/", "")}</DetailRow>
                  <DetailRow label="Queue Rank">{priorityItems.findIndex((item) => item.id === selectedItem.id) + 1}</DetailRow>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-2" onClick={handlePrimaryAction} disabled={resolveAlert.isPending || resolveDrift.isPending}>
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedItem.type === "Vulnerability" ? "Open Workbench" : "Resolve"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleSecondaryAction} disabled={acknowledgeAlert.isPending || acknowledgeDrift.isPending}>
                    <Shield className="h-4 w-4" />
                    {selectedItem.type === "Vulnerability" ? "Find Related" : "Acknowledge"}
                  </Button>
                  {selectedItem.type === "Drift" && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={handleApproveBaseline} disabled={approveDrift.isPending}>
                      <Network className="h-4 w-4" />
                      Approve Baseline
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab === "alerts" || defaultTab === "drifts" ? defaultTab : "risk"} className="mt-6">
        <TabsList>
          <TabsTrigger value="risk">Priority Queue</TabsTrigger>
          <TabsTrigger value="drifts">Drift</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="mt-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <CardDescription>Highest risk active work across security workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <EmptyPanel icon={Shield} title="Loading security state" description="Collecting alerts, drifts, and vulnerability findings." />
              ) : priorityItems.length === 0 ? (
                <EmptyPanel icon={CheckCircle2} title="No active security work" description="All tracked security findings are closed or currently filtered out." />
              ) : (
                <div className="grid gap-3">
                  {priorityItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
                        selectedItem?.id === item.id && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap gap-2">
                            <ToneBadge value={item.severity} />
                            <ToneBadge value={item.type} tone="blue" />
                          </div>
                          <h3 className="text-sm font-semibold capitalize">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{item.resource}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTimeAgo(item.time)}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(item.route);
                            }}
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drifts" className="mt-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Drift Summary</CardTitle>
              <CardDescription>Open baseline changes by severity</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {["critical", "high", "medium", "low"].map((severity) => (
                <div key={severity} className="rounded-lg border p-4">
                  <ToneBadge value={severity} />
                  <div className="mt-3 text-2xl font-semibold">{openDrifts.filter((drift) => drift.severity === severity).length}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Alert Summary</CardTitle>
              <CardDescription>Unresolved alert distribution</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {["critical", "high", "medium", "low"].map((severity) => (
                <div key={severity} className="rounded-lg border p-4">
                  <ToneBadge value={severity} />
                  <div className="mt-3 text-2xl font-semibold">{openAlerts.filter((alert) => alert.severity === severity).length}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
