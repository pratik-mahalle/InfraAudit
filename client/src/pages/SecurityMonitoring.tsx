import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityDrift, Resource, Alert } from "@/types";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff, 
  Search, 
  Filter, 
  Bell, 
  BellRing, 
  BellOff, 
  AlertTriangle,
  CloudIcon,
  Database 
} from "lucide-react";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/utils";

export default function SecurityMonitoring() {
  // Common state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMainTab, setActiveMainTab] = useState<string>("drifts");
  
  // Drifts-specific state
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [activeDriftTab, setActiveDriftTab] = useState<string>("all");
  
  // Alerts-specific state
  const [alertType, setAlertType] = useState<string>("all");
  const [alertSeverity, setAlertSeverity] = useState<string>("all");
  const [alertStatus, setAlertStatus] = useState<string>("all");
  const [activeAlertTab, setActiveAlertTab] = useState<string>("all");

  // Fetch security drifts
  const { data: securityDrifts, isLoading: isLoadingDrifts } = useQuery<SecurityDrift[]>({
    queryKey: ["/api/security-drifts"],
  });

  // Fetch alerts
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Fetch resources to get names
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const getResourceName = (id: number) => {
    const resource = resources?.find((r) => r.id === id);
    return resource ? resource.name : `Resource ID: ${id}`;
  };

  // Filter drifts based on criteria
  const filteredDrifts = securityDrifts
    ? securityDrifts.filter((drift) => {
        const matchesSeverity = severity === "all" || drift.severity === severity;
        const matchesStatus = status === "all" || drift.status === status;
        const resourceName = getResourceName(drift.resourceId).toLowerCase();
        const matchesSearch =
          searchQuery === "" ||
          resourceName.includes(searchQuery.toLowerCase()) ||
          drift.driftType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          drift.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSeverity && matchesStatus && matchesSearch;
      })
    : [];

  // Filter by specific criteria - for drift tabs
  const criticalDrifts = filteredDrifts.filter(d => d.severity === 'critical');
  const highDrifts = filteredDrifts.filter(d => d.severity === 'high');
  const remediatedDrifts = filteredDrifts.filter(d => d.status === 'remediated');

  // Filter alerts based on criteria
  const filteredAlerts = alerts
    ? alerts.filter((alert) => {
        const matchesType = alertType === "all" || alert.type === alertType;
        const matchesSeverity = alertSeverity === "all" || alert.severity === alertSeverity;
        const matchesStatus = alertStatus === "all" || alert.status === alertStatus;
        const resourceName = getResourceName(alert.resourceId).toLowerCase();
        const matchesSearch =
          searchQuery === "" ||
          resourceName.includes(searchQuery.toLowerCase()) ||
          alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesType && matchesSeverity && matchesStatus && matchesSearch;
      })
    : [];

  // Summary counts
  const criticalCount = securityDrifts?.filter(d => d.severity === 'critical').length || 0;
  const highCount = securityDrifts?.filter(d => d.severity === 'high').length || 0;
  const mediumCount = securityDrifts?.filter(d => d.severity === 'medium').length || 0;
  const openCount = securityDrifts?.filter(d => d.status === 'open').length || 0;
  
  // Alert summary counts
  const alertsCount = alerts?.length || 0;
  const criticalAlertsCount = alerts?.filter(a => a.severity === 'critical').length || 0;
  const openAlertsCount = alerts?.filter(a => a.status === 'open').length || 0;

  // Update search placeholder based on active tab
  const searchPlaceholder = activeMainTab === "drifts" 
    ? "Search resources or drift types..." 
    : "Search alerts or resources...";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold font-inter mb-1">Security Monitoring</h1>
        <p className="text-gray-500">
          Monitor and remediate security configuration drifts and alerts across your cloud infrastructure
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-danger bg-opacity-10 p-3 rounded-full">
                <ShieldAlert className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical Drifts</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm" className="text-xs">
                Remediate All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                <BellRing className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Open Alerts</p>
                <p className="text-2xl font-bold">{openAlertsCount}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">{alertsCount} total alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Security Issues</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">{securityDrifts?.length || 0} total drifts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs - Configuration Drifts vs Alerts */}
      <Tabs defaultValue="drifts" className="mb-6" onValueChange={setActiveMainTab}>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
          <TabsList>
            <TabsTrigger value="drifts">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Configuration Drifts</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span>Alerts</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeMainTab === "drifts" ? (
              <div className="flex space-x-2">
                <Select
                  value={severity}
                  onValueChange={setSeverity}
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="remediated">Remediated</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Select
                  value={alertType}
                  onValueChange={setAlertType}
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Alert Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={alertSeverity}
                  onValueChange={setAlertSeverity}
                >
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Drifts Tab Content */}
        <TabsContent value="drifts">
          <Tabs defaultValue="all" onValueChange={setActiveDriftTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Drifts</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="remediated">Remediated</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Security Configuration Drifts</CardTitle>
                  <CardDescription>
                    {filteredDrifts.length} drift{filteredDrifts.length !== 1 ? 's' : ''} found across your infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDrifts ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Loading security drifts...
                          </TableCell>
                        </TableRow>
                      ) : filteredDrifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No security drifts found matching the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDrifts.map((drift) => (
                          <TableRow key={drift.id}>
                            <TableCell className="font-medium">
                              {getResourceName(drift.resourceId)}
                            </TableCell>
                            <TableCell>{drift.driftType}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)} rounded-full`}>
                                {drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {drift.details ? JSON.stringify(drift.details) : 'No details'}
                            </TableCell>
                            <TableCell>{formatTimeAgo(new Date(drift.detectedAt))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                drift.status === 'open' 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : drift.status === 'remediated'
                                    ? 'bg-secondary bg-opacity-10 text-secondary'
                                    : 'bg-primary bg-opacity-10 text-primary'
                              }`}>
                                {drift.status.charAt(0).toUpperCase() + drift.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-primary hover:text-primary/80"
                                disabled={drift.status !== 'open'}
                              >
                                {drift.status === 'open' ? 'Remediate' : 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="critical">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Critical Security Issues</CardTitle>
                  <CardDescription>
                    {criticalDrifts.length} critical drift{criticalDrifts.length !== 1 ? 's' : ''} found that require immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDrifts ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Loading critical drifts...
                          </TableCell>
                        </TableRow>
                      ) : criticalDrifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No critical drifts found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        criticalDrifts.map((drift) => (
                          <TableRow key={drift.id}>
                            <TableCell className="font-medium">
                              {getResourceName(drift.resourceId)}
                            </TableCell>
                            <TableCell>{drift.driftType}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)} rounded-full`}>
                                {drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {drift.details ? JSON.stringify(drift.details) : 'No details'}
                            </TableCell>
                            <TableCell>{formatTimeAgo(new Date(drift.detectedAt))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                drift.status === 'open' 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : drift.status === 'remediated'
                                    ? 'bg-secondary bg-opacity-10 text-secondary'
                                    : 'bg-primary bg-opacity-10 text-primary'
                              }`}>
                                {drift.status.charAt(0).toUpperCase() + drift.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-primary hover:text-primary/80"
                                disabled={drift.status !== 'open'}
                              >
                                {drift.status === 'open' ? 'Remediate' : 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="high">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>High Severity Issues</CardTitle>
                  <CardDescription>
                    {highDrifts.length} high severity drift{highDrifts.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDrifts ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Loading high severity drifts...
                          </TableCell>
                        </TableRow>
                      ) : highDrifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No high severity drifts found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        highDrifts.map((drift) => (
                          <TableRow key={drift.id}>
                            {/* Same content as other tabs */}
                            <TableCell className="font-medium">
                              {getResourceName(drift.resourceId)}
                            </TableCell>
                            <TableCell>{drift.driftType}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)} rounded-full`}>
                                {drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {drift.details ? JSON.stringify(drift.details) : 'No details'}
                            </TableCell>
                            <TableCell>{formatTimeAgo(new Date(drift.detectedAt))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                drift.status === 'open' 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : drift.status === 'remediated'
                                    ? 'bg-secondary bg-opacity-10 text-secondary'
                                    : 'bg-primary bg-opacity-10 text-primary'
                              }`}>
                                {drift.status.charAt(0).toUpperCase() + drift.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-primary hover:text-primary/80"
                                disabled={drift.status !== 'open'}
                              >
                                {drift.status === 'open' ? 'Remediate' : 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="remediated">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Remediated Issues</CardTitle>
                  <CardDescription>
                    {remediatedDrifts.length} remediated drift{remediatedDrifts.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDrifts ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Loading remediated drifts...
                          </TableCell>
                        </TableRow>
                      ) : remediatedDrifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No remediated drifts found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        remediatedDrifts.map((drift) => (
                          <TableRow key={drift.id}>
                            {/* Same content as other tabs */}
                            <TableCell className="font-medium">
                              {getResourceName(drift.resourceId)}
                            </TableCell>
                            <TableCell>{drift.driftType}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)} rounded-full`}>
                                {drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {drift.details ? JSON.stringify(drift.details) : 'No details'}
                            </TableCell>
                            <TableCell>{formatTimeAgo(new Date(drift.detectedAt))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                drift.status === 'open' 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : drift.status === 'remediated'
                                    ? 'bg-secondary bg-opacity-10 text-secondary'
                                    : 'bg-primary bg-opacity-10 text-primary'
                              }`}>
                                {drift.status.charAt(0).toUpperCase() + drift.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-primary hover:text-primary/80"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Alerts Tab Content */}
        <TabsContent value="alerts">
          <Tabs defaultValue="all" onValueChange={setActiveAlertTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="cost">Cost</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Infrastructure Alerts</CardTitle>
                  <CardDescription>
                    {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} across your infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Time</TableHead>
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
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(alert.severity)} ${getSeverityColor(alert.severity)} rounded-full`}>
                                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {alert.type === 'security' ? (
                                  <ShieldAlert className="h-4 w-4 text-danger" />
                                ) : alert.type === 'performance' ? (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                ) : alert.type === 'cost' ? (
                                  <Database className="h-4 w-4 text-primary" />
                                ) : (
                                  <CloudIcon className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="capitalize">{alert.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getResourceName(alert.resourceId)}
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate">
                              {alert.message}
                            </TableCell>
                            <TableCell>{formatTimeAgo(new Date(alert.createdAt))}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                alert.status === 'open' 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : alert.status === 'investigating'
                                    ? 'bg-primary bg-opacity-10 text-primary'
                                    : 'bg-secondary bg-opacity-10 text-secondary'
                              }`}>
                                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-primary hover:text-primary/80"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Similar content for other alert tabs (security, performance, cost) */}
            <TabsContent value="security">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Security Alerts</CardTitle>
                  <CardDescription>
                    Security-related alerts across your cloud infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAlerts ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Loading security alerts...
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAlerts
                          .filter(alert => alert.type === 'security')
                          .map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(alert.severity)} ${getSeverityColor(alert.severity)} rounded-full`}>
                                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">
                                {getResourceName(alert.resourceId)}
                              </TableCell>
                              <TableCell className="max-w-[250px] truncate">
                                {alert.message}
                              </TableCell>
                              <TableCell>{formatTimeAgo(new Date(alert.createdAt))}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  alert.status === 'open' 
                                    ? 'bg-warning bg-opacity-10 text-warning' 
                                    : alert.status === 'investigating'
                                      ? 'bg-primary bg-opacity-10 text-primary'
                                      : 'bg-secondary bg-opacity-10 text-secondary'
                                }`}>
                                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-primary hover:text-primary/80"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
