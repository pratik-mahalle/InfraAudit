import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertFilterBar } from "@/components/dashboard/AlertFilterBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, Resource } from "@/types";
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Settings, 
  CloudIcon, 
  AlertTriangle, 
  Shield, 
  Database 
} from "lucide-react";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/utils";
import { useAlerts, useAlertSummary, useAcknowledgeAlert, useResolveAlert } from "@/hooks/use-alerts";
import { useResources } from "@/hooks/use-resources";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Alerts() {
  const [alertType, setAlertType] = useState<string>("all");
  const [alertSeverity, setAlertSeverity] = useState<string>("all");
  const [alertStatus, setAlertStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch notification channel preferences from real API
  const { data: notifPrefsResponse } = useNotificationPreferences();
  const notifPrefs = Array.isArray(notifPrefsResponse) ? notifPrefsResponse : (notifPrefsResponse as any)?.data ?? [];

  // Fetch paginated alerts from the real backend
  const { data: alertsResponse, isLoading: isLoadingAlerts } = useAlerts();
  const alerts = alertsResponse?.data ?? [];

  // Fetch alert summary for the summary cards
  const { data: alertSummary } = useAlertSummary();

  // Fetch resources for name lookup (paginated — extract .data)
  const { data: resourcesResponse } = useResources();
  const resources = resourcesResponse?.data ?? [];

  // Mutations for acknowledge and resolve
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const handleAcknowledge = (id: number) => {
    acknowledgeAlert.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Alert Acknowledged",
          description: "The alert has been marked as acknowledged.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to acknowledge alert.",
          variant: "destructive",
        });
      },
    });
  };

  const handleResolve = (id: number) => {
    resolveAlert.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Alert Resolved",
          description: "The alert has been marked as resolved.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to resolve alert.",
          variant: "destructive",
        });
      },
    });
  };

  const getResourceName = (id?: number) => {
    if (!id) return "N/A";
    const resource = resources.find((r) => r.id === id);
    if (resource) return resource.name;
    return `Resource ID: ${id}`;
  };

  // Filter alerts based on criteria
  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = alertType === "all" || alert.type === alertType;
    const matchesSeverity = alertSeverity === "all" || alert.severity === alertSeverity;
    const matchesStatus = alertStatus === "all" || alert.status === alertStatus;
    const matchesSearch = searchQuery === "" ||
      (alert.title && alert.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.message && alert.message.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  // Summary counts from the real /api/alerts/summary endpoint
  const criticalCount = alertSummary?.critical ?? 0;
  const highCount = alertSummary?.high ?? 0;
  const mediumCount = alertSummary?.medium ?? 0;
  const lowCount = alertSummary?.low ?? 0;

  // Helper to render the alerts table for any given list
  const renderAlertsTable = (alertList: Alert[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoadingAlerts ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              Loading alerts...
            </TableCell>
          </TableRow>
        ) : alertList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              No alerts found matching the current filters.
            </TableCell>
          </TableRow>
        ) : (
          alertList.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell className="font-medium max-w-[300px] truncate">
                {alert.title}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {alert.type}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(alert.severity)} ${getSeverityColor(alert.severity)} rounded-full`}>
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                {alert.resourceId ? getResourceName(alert.resourceId) : "N/A"}
              </TableCell>
              <TableCell>{formatTimeAgo(alert.createdAt)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  alert.status === "open"
                    ? "bg-warning bg-opacity-10 text-warning"
                    : alert.status === "acknowledged"
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "bg-secondary bg-opacity-10 text-secondary"
                }`}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {alert.status === "open" && (
                    <>
                      {alert.type === "security" && (
                        <Button size="sm" variant="default" className="h-8">
                          Remediate
                        </Button>
                      )}
                      {alert.type === "cost" && (
                        <Button size="sm" variant="default" className="h-8">
                          Investigate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={acknowledgeAlert.isPending}
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </>
                  )}
                  {alert.status === "acknowledged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={resolveAlert.isPending}
                      onClick={() => handleResolve(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  {alert.status === "resolved" && (
                    <Button size="sm" variant="ghost" className="h-8">
                      Details
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  // Filtered lists for the typed tabs
  const securityAlerts = filteredAlerts.filter((a) => a.type === "security");
  const costAlerts = filteredAlerts.filter((a) => a.type === "cost");
  const resourceAlerts = filteredAlerts.filter((a) => a.type === "resource");

  return (
    <DashboardLayout>
      <PageHeader
        title="Alerts"
        description="Monitor and respond to infrastructure alerts"
        actions={
          <Button className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure Alerts
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-danger bg-opacity-10 p-3 rounded-full">
                <BellRing className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">High</p>
                <p className="text-2xl font-bold">{highCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-500 bg-opacity-10 p-3 rounded-full">
                <Bell className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Medium</p>
                <p className="text-2xl font-bold">{mediumCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                <BellOff className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low</p>
                <p className="text-2xl font-bold">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Filtering */}
      <AlertFilterBar
        alertType={alertType}
        setAlertType={setAlertType}
        alertSeverity={alertSeverity}
        setAlertSeverity={setAlertSeverity}
        alertStatus={alertStatus}
        setAlertStatus={setAlertStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Alerts List */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="resource">Resource</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>
                All active alerts across your infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAlertsTable(filteredAlerts)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Security-related alerts including configuration drifts and policy changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAlertsTable(securityAlerts)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Alerts</CardTitle>
              <CardDescription>
                Cost anomalies and budget threshold alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAlertsTable(costAlerts)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resource" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Alerts</CardTitle>
              <CardDescription>
                Resource utilization and status alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAlertsTable(resourceAlerts)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Settings — driven by real API data */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Configure where alerts are sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(["slack", "email", "webhook"] as const).map((channel) => {
              const pref = notifPrefs.find((p: any) => p.channel === channel);
              const isEnabled = pref?.is_enabled ?? pref?.isEnabled ?? pref?.enabled ?? false;
              const channelConfig: Record<string, { label: string; desc: string; bgColor: string; icon: React.ReactNode }> = {
                slack: {
                  label: "Slack",
                  desc: pref?.config?.webhook_url ? "Webhook configured" : "Slack notifications",
                  bgColor: "bg-[#4A154B]",
                  icon: <Bell className="h-5 w-5 text-white" />,
                },
                email: {
                  label: "Email",
                  desc: pref?.config?.to ? `Sending to ${Array.isArray(pref.config.to) ? pref.config.to.join(', ') : pref.config.to}` : "Email notifications",
                  bgColor: "bg-blue-600",
                  icon: <BellRing className="h-5 w-5 text-white" />,
                },
                webhook: {
                  label: "Webhook",
                  desc: "Webhook notifications",
                  bgColor: "bg-gray-800",
                  icon: <Settings className="h-5 w-5 text-white" />,
                },
              };
              const cfg = channelConfig[channel];
              return (
                <div key={channel} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`${cfg.bgColor} p-2 rounded`}>{cfg.icon}</div>
                    <div>
                      <h3 className="font-medium">{cfg.label}</h3>
                      <p className="text-sm text-gray-500">{cfg.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {isEnabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings?tab=notifications")}>
                      Configure
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
