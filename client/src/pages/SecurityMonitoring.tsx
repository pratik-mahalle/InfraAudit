import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BellRing,
  Bug,
  CheckCircle2,
  Cloud,
  ExternalLink,
  GitCompareArrows,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlerts } from "@/hooks/use-alerts";
import { useDrifts } from "@/hooks/use-drifts";
import { useResources } from "@/hooks/use-resources";
import { useVulnerabilities } from "@/hooks/use-vulnerabilities";
import { formatTimeAgo } from "@/lib/utils";
import type { Alert, Drift, Vulnerability } from "@/lib/api";
import { EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";

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
  const { data: alertsResponse, isLoading: alertsLoading } = useAlerts();
  const { data: driftsResponse, isLoading: driftsLoading } = useDrifts();
  const { data: vulnerabilitiesResponse, isLoading: vulnerabilitiesLoading } = useVulnerabilities();
  const { data: resourcesResponse } = useResources();

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
    })),
  ].sort((a, b) => riskWeight(b.severity) - riskWeight(a.severity)).slice(0, 8);

  const criticalCount = priorityItems.filter((item) => item.severity === "critical").length;
  const highCount = priorityItems.filter((item) => item.severity === "high").length;
  const loading = alertsLoading || driftsLoading || vulnerabilitiesLoading;

  const driftCoverage = drifts.length ? Math.round((drifts.filter((drift) => drift.status === "resolved" || drift.status === "approved").length / drifts.length) * 100) : 100;
  const vulnerabilityClosure = vulnerabilities.length ? Math.round((vulnerabilities.filter((vulnerability) => vulnerability.status === "fixed").length / vulnerabilities.length) * 100) : 100;
  const alertClosure = alerts.length ? Math.round((alerts.filter((alert) => alert.status === "resolved").length / alerts.length) * 100) : 100;

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
            <Button className="gap-2" onClick={() => navigate("/vulnerabilities")}>
              <Bug className="h-4 w-4" />
              Vulnerabilities
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
                <div className="divide-y rounded-lg border">
                  {priorityItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className="w-full px-4 py-4 text-left transition-colors hover:bg-muted/50"
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
                          <ExternalLink className="h-3 w-3" />
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
