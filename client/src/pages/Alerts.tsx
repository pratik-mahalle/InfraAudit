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
import { formatTimeAgo } from "@/lib/utils";
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

      <div className="mt-6">
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
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Alert Queue</CardTitle>
            <CardDescription>{filteredAlerts.length} alerts match the current view</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyPanel icon={Bell} title="Loading alerts" description="Fetching current alert state from InfraAudit." />
            ) : filteredAlerts.length === 0 ? (
              <EmptyPanel icon={CheckCircle2} title="No alerts in this view" description="Change filters or run a scan to surface new alert activity." />
            ) : (
              <div className="divide-y rounded-lg border">
                {filteredAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`w-full px-4 py-4 text-left transition-colors hover:bg-muted/50 ${selectedAlert?.id === alert.id ? "bg-muted" : ""}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ToneBadge value={alert.severity} />
                          <ToneBadge value={alert.status} />
                          <span className="text-xs capitalize text-muted-foreground">{alert.type}</span>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-semibold">{alert.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(alert.createdAt)}</div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">{resourceName(alert.resourceId)}</div>
                  </button>
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
