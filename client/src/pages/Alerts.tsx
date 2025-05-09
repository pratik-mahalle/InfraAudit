import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Bell, BellRing, BellOff, Settings } from "lucide-react";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/utils";

export default function Alerts() {
  const [alertType, setAlertType] = useState<string>("all");
  const [alertSeverity, setAlertSeverity] = useState<string>("all");
  const [alertStatus, setAlertStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch alerts
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Fetch resources to get names
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const getResourceName = (id?: number) => {
    if (!id) return "N/A";
    const resource = resources?.find((r) => r.id === id);
    return resource ? resource.name : `Resource ID: ${id}`;
  };

  // Filter alerts based on criteria
  const filteredAlerts = alerts
    ? alerts.filter((alert) => {
        const matchesType = alertType === "all" || alert.type === alertType;
        const matchesSeverity = alertSeverity === "all" || alert.severity === alertSeverity;
        const matchesStatus = alertStatus === "all" || alert.status === alertStatus;
        const matchesSearch =
          searchQuery === "" ||
          alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.message.toLowerCase().includes(searchQuery.toLowerCase());
          
        return matchesType && matchesSeverity && matchesStatus && matchesSearch;
      })
    : [];

  // Count alerts by severity
  const criticalCount = alerts?.filter(a => a.severity === 'critical').length || 0;
  const highCount = alerts?.filter(a => a.severity === 'high').length || 0;
  const mediumCount = alerts?.filter(a => a.severity === 'medium').length || 0;
  const lowCount = alerts?.filter(a => a.severity === 'low').length || 0;

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
                  ) : filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No alerts found matching the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => (
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
                                <Button size="sm" variant="outline" className="h-8">
                                  Acknowledge
                                </Button>
                              </>
                            )}
                            {alert.status === "acknowledged" && (
                              <Button size="sm" variant="outline" className="h-8">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents follow the same pattern but would filter by type */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Security-related alerts including configuration drifts and policy changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Same table but filtered for security alerts */}
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
              {/* Same table but filtered for cost alerts */}
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
              {/* Same table but filtered for resource alerts */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Configure where alerts are sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-[#4A154B] p-2 rounded">
                  <svg viewBox="0 0 54 54" className="h-5 w-5 text-white">
                    <path
                      fill="currentColor"
                      d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
                    />
                    <path
                      fill="currentColor"
                      d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
                    />
                    <path
                      fill="currentColor"
                      d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
                    />
                    <path
                      fill="currentColor"
                      d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.25a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Slack</h3>
                  <p className="text-sm text-gray-500">Send alerts to Slack channel #cloud-alerts</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="success">Connected</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-2 rounded">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.2,12.2c0,1.1-0.3,2.2-0.8,3.2c-0.5,1-1.3,1.8-2.2,2.3C17.2,18.3,16,18.6,14.7,18.6c-1.1,0-2.2-0.3-3.2-0.8l-6.5,1.9l1.9-6.5	c-0.5-1-0.8-2.1-0.8-3.2c0-1.3,0.3-2.5,0.9-3.5c0.5-1,1.3-1.8,2.3-2.2c1-0.5,2.1-0.8,3.2-0.8c1.3,0,2.5,0.3,3.5,0.9c1,0.5,1.8,1.3,2.2,2.3C20.9,9.7,21.2,10.9,21.2,12.2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-gray-500">Send alerts to devops@company.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="success">Connected</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-800 p-2 rounded">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.5,1h-19C1.7,1,1,1.7,1,2.5v19C1,22.3,1.7,23,2.5,23h19c0.8,0,1.5-0.7,1.5-1.5v-19C23,1.7,22.3,1,21.5,1z M8.7,19H6.2v-8h2.5V19z M7.4,9.8c-0.8,0-1.4-0.7-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4c0.8,0,1.4,0.6,1.4,1.4C8.9,9.1,8.2,9.8,7.4,9.8z M19,19h-2.5v-4c0-2.5-3-2.3-3,0v4H11v-8h2.5v1.5c1.3-2.4,5.5-2.6,5.5,2.3V19z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">PagerDuty</h3>
                  <p className="text-sm text-gray-500">Send critical alerts to on-call team</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">Not Connected</Badge>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
