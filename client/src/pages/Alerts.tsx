import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageSquare,
  Settings,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAlerts, useAlertSummary, useAcknowledgeAlert, useResolveAlert } from "@/hooks/use-alerts";
import { useResources } from "@/hooks/use-resources";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Alert } from "@/lib/api";
import {
  ActionButton,
  DetailRow,
  EmptyPanel,
  FilterToolbar,
  MetricTile,
  ToneBadge,
} from "@/components/security-ops/ops-ui";

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "security", label: "Security" },
  { value: "cost", label: "Cost" },
  { value: "resource", label: "Resource" },
  { value: "performance", label: "Performance" },
  { value: "compliance", label: "Compliance" },
];

const severityOptions = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export default function Alerts() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");

  const { data: alertsResponse, isLoading } = useAlerts();
  const { data: alertSummary } = useAlertSummary();
  const { data: resourcesResponse } = useResources();
  const { data: notifPrefsResponse } = useNotificationPreferences();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const alerts = alertsResponse?.data ?? [];
  const resources = resourcesResponse?.data ?? [];
  const notificationPrefs = Array.isArray(notifPrefsResponse)
    ? notifPrefsResponse
    : (notifPrefsResponse as any)?.data ?? [];

  const resourceName = (resourceId?: number) => {
    if (!resourceId) return "No resource linked";
    return resources.find((resource) => resource.id === resourceId)?.name ?? `Resource ${resourceId}`;
  };

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesType = typeFilter === "all" || alert.type === typeFilter;
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
      const haystack = `${alert.title} ${alert.message} ${resourceName(alert.resourceId)}`.toLowerCase();
      return matchesType && matchesSeverity && matchesStatus && (!query || haystack.includes(query));
    });
  }, [alerts, resources, searchQuery, severityFilter, statusFilter, typeFilter]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedAlertId) ?? filteredAlerts[0] ?? null;
  const openAlerts = alerts.filter((alert) => alert.status === "open");
  const acknowledgedAlerts = alerts.filter((alert) => alert.status === "acknowledged");
  const criticalOpen = openAlerts.filter((alert) => alert.severity === "critical").length;
  const alertTypes = Object.entries(alerts.reduce<Record<string, number>>((counts, alert) => {
    counts[alert.type] = (counts[alert.type] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
  const alertLanes = [
    { label: "Critical Now", items: filteredAlerts.filter((alert) => alert.status !== "resolved" && alert.severity === "critical"), tone: "red" as const },
    { label: "High Priority", items: filteredAlerts.filter((alert) => alert.status !== "resolved" && alert.severity === "high"), tone: "orange" as const },
    { label: "Open Review", items: filteredAlerts.filter((alert) => alert.status === "open" && alert.severity !== "critical" && alert.severity !== "high"), tone: "amber" as const },
    { label: "Acknowledged", items: filteredAlerts.filter((alert) => alert.status === "acknowledged"), tone: "blue" as const },
    { label: "Resolved", items: filteredAlerts.filter((alert) => alert.status === "resolved"), tone: "emerald" as const },
  ].filter((lane) => lane.items.length > 0);

  const openAlertContext = (alert: Alert) => {
    const resource = resources.find((item) => item.id === alert.resourceId);
    const identifier = resource?.resourceId ?? resource?.id;
    if (identifier) {
      navigate(`/resources/${encodeURIComponent(String(identifier))}`);
      return;
    }
    navigate(alert.type === "cost" ? "/cost" : "/drift-detection");
  };

  const acknowledge = (alert: Alert) => {
    acknowledgeAlert.mutate(alert.id, {
      onSuccess: () => toast({ title: "Alert acknowledged", description: "The alert moved out of the open queue." }),
      onError: (error: Error) => toast({ title: "Could not acknowledge alert", description: error.message, variant: "destructive" }),
    });
  };

  const resolve = (alert: Alert) => {
    resolveAlert.mutate(alert.id, {
      onSuccess: () => toast({ title: "Alert resolved", description: "The alert has been closed." }),
      onError: (error: Error) => toast({ title: "Could not resolve alert", description: error.message, variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Alert Inbox"
        description="Triage infrastructure alerts, route owners to context, and keep notification channels healthy."
        actions={
          <Button variant="outline" className="gap-2" onClick={() => navigate("/settings?tab=notifications")}>
            <Settings className="h-4 w-4" />
            Notification Rules
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={BellRing} label="Open alerts" value={alertSummary?.open ?? openAlerts.length} tone="red" helper={`${criticalOpen} critical open`} />
        <MetricTile icon={Clock3} label="Acknowledged" value={alertSummary?.acknowledged ?? acknowledgedAlerts.length} tone="amber" helper="Waiting for closure" />
        <MetricTile icon={CheckCircle2} label="Resolved" value={alertSummary?.resolved ?? 0} tone="emerald" helper="Closed alerts" />
        <MetricTile icon={MessageSquare} label="Channels" value={notificationPrefs.filter((pref: any) => pref.isEnabled ?? pref.is_enabled ?? pref.enabled).length} tone="blue" helper="Enabled destinations" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <FilterToolbar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search title, message, or resource..."
          filters={[
            { value: typeFilter, onChange: setTypeFilter, placeholder: "Type", options: typeOptions },
            { value: severityFilter, onChange: setSeverityFilter, placeholder: "Severity", options: severityOptions },
            { value: statusFilter, onChange: setStatusFilter, placeholder: "Status", options: statusOptions },
          ]}
        />
        <Card className="rounded-lg">
          <CardContent className="flex h-full flex-col justify-center gap-3 p-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={statusFilter === "open" ? "default" : "outline"} onClick={() => setStatusFilter("open")}>Open</Button>
              <Button size="sm" variant={severityFilter === "critical" ? "default" : "outline"} onClick={() => setSeverityFilter("critical")}>Critical</Button>
              <Button size="sm" variant={statusFilter === "acknowledged" ? "default" : "outline"} onClick={() => setStatusFilter("acknowledged")}>Acknowledged</Button>
              <Button size="sm" variant="outline" onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setSeverityFilter("all");
                setStatusFilter("open");
              }}>Reset</Button>
            </div>
            <p className="text-xs text-muted-foreground">Alert filters update routing lanes and selected context immediately.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Alert Routing Board</CardTitle>
            <CardDescription>{filteredAlerts.length} alerts grouped by response state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertTypes.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {alertTypes.slice(0, 5).map(([type, count]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className="rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <p className="text-xs capitalize text-muted-foreground">{type}</p>
                    <p className="mt-1 text-lg font-semibold">{count}</p>
                  </button>
                ))}
              </div>
            )}
            {isLoading ? (
              <EmptyPanel icon={Bell} title="Loading alerts" description="Fetching current alert state from InfraAudit." />
            ) : filteredAlerts.length === 0 ? (
              <EmptyPanel icon={CheckCircle2} title="No alerts in this view" description="Change filters or run a scan to surface new alert activity." />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {alertLanes.map((lane) => (
                  <section key={lane.label} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{lane.label}</h3>
                      <ToneBadge value={lane.items.length} tone={lane.tone} />
                    </div>
                    <div className="space-y-2">
                      {lane.items.slice(0, 8).map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => setSelectedAlertId(alert.id)}
                          className={cn(
                            "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
                            selectedAlert?.id === alert.id && "border-primary/50 bg-primary/5",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <ToneBadge value={alert.severity} />
                                <ToneBadge value={alert.status} />
                              </div>
                              <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{alert.title}</h3>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(alert.createdAt)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{alert.message}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{alert.type}</span>
                            <span>{resourceName(alert.resourceId)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {lane.items.length > 8 && (
                      <p className="mt-3 text-xs text-muted-foreground">+{lane.items.length - 8} more in this lane.</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Alert Context</CardTitle>
              <CardDescription>Selected item details and response actions</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedAlert ? (
                <EmptyPanel icon={AlertCircle} title="No alert selected" description="Select an alert from the queue to inspect the incident context." />
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <ToneBadge value={selectedAlert.severity} />
                      <ToneBadge value={selectedAlert.status} />
                      <ToneBadge value={selectedAlert.type} tone="blue" />
                    </div>
                    <h2 className="text-lg font-semibold">{selectedAlert.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedAlert.message}</p>
                  </div>
                  <Separator />
                  <dl className="grid gap-4">
                    <DetailRow label="Resource">{resourceName(selectedAlert.resourceId)}</DetailRow>
                    <DetailRow label="Created">{formatTimeAgo(selectedAlert.createdAt)}</DetailRow>
                    <DetailRow label="Routing">{selectedAlert.type === "cost" ? "FinOps review" : selectedAlert.type === "security" ? "Security review" : "Platform review"}</DetailRow>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton onClick={() => openAlertContext(selectedAlert)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Context
                    </ActionButton>
                    {selectedAlert.status === "open" && (
                      <ActionButton variant="outline" onClick={() => acknowledge(selectedAlert)} disabled={acknowledgeAlert.isPending}>
                        Acknowledge
                      </ActionButton>
                    )}
                    {selectedAlert.status !== "resolved" && (
                      <ActionButton variant="outline" onClick={() => resolve(selectedAlert)} disabled={resolveAlert.isPending}>
                        Resolve
                      </ActionButton>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Delivery status for alert routing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["slack", "email", "webhook"] as const).map((channel) => {
                const pref = notificationPrefs.find((item: any) => item.channel === channel);
                const enabled = pref?.isEnabled ?? pref?.is_enabled ?? pref?.enabled ?? false;
                return (
                  <div key={channel} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border bg-muted/50 p-2">
                        {channel === "slack" ? <MessageSquare className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{channel}</p>
                        <p className="text-xs text-muted-foreground">{enabled ? "Receiving alert notifications" : "Delivery disabled"}</p>
                      </div>
                    </div>
                    <ToneBadge value={enabled ? "enabled" : "disabled"} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
