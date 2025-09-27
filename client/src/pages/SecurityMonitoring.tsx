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
  const remediatedCount = securityDrifts?.filter(d => d.status === 'remediated').length || 0;
  const totalDrifts = securityDrifts?.length || 0;
  const compliancePercent = totalDrifts ? Math.round((remediatedCount / totalDrifts) * 100) : 100;
  
  // Alert summary counts
  const alertsCount = alerts?.length || 0;
  const criticalAlertsCount = alerts?.filter(a => a.severity === 'critical').length || 0;
  const highAlertsCount = alerts?.filter(a => a.severity === 'high').length || 0;
  const mediumAlertsCount = alerts?.filter(a => a.severity === 'medium').length || 0;
  const openAlertsCount = alerts?.filter(a => a.status === 'open').length || 0;

  // Non-compliant resources breakdown (based on open drifts by resource type)
  const typeForResource = (id: number) => {
    const r = resources?.find(r => r.id === id);
    const t = (r as any)?.type as string | undefined;
    return t ? t.toLowerCase() : "other";
  };
  const openDrifts = securityDrifts?.filter(d => d.status === 'open') || [];
  const nodesCount = openDrifts.filter(d => typeForResource(d.resourceId).includes('node')).length;
  const workloadsCount = openDrifts.filter(d => typeForResource(d.resourceId).includes('work')).length;
  const otherCount = Math.max(0, openDrifts.length - nodesCount - workloadsCount);

  // Vulnerable image repositories (derived from alerts by resource)
  const repoRows = (alerts || [])
    .filter(a => a.type === 'security')
    .reduce<Record<string, { name: string; critical: number; high: number; medium: number; fixes: number }>>((acc, a) => {
      const name = getResourceName(a.resourceId);
      if (!acc[name]) acc[name] = { name, critical: 0, high: 0, medium: 0, fixes: 0 };
      if (a.severity === 'critical') acc[name].critical += 1;
      else if (a.severity === 'high') acc[name].high += 1;
      else if (a.severity === 'medium') acc[name].medium += 1;
      return acc;
    }, {});
  const repoList = Object.values(repoRows).slice(0, 3);

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

      {/* Compliance + Vulnerabilities (revamped header) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance */}
        <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compliance</CardTitle>
            <CardDescription>Compliance with InfrAudit checks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28">
                  <div
                    className="w-28 h-28 rounded-full"
                    style={{
                      background: `conic-gradient(var(--color-primary) ${compliancePercent * 3.6}deg, rgba(2,132,199,0.15) 0deg)`
                    }}
                  />
                  <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className="text-3xl font-bold">{compliancePercent}%</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{remediatedCount}/{totalDrifts || 1} checks passed</p>
                  <p className="text-xs text-muted-foreground mt-1">{openCount} open issues</p>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Non-compliant resources</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Nodes</span><span>{nodesCount}</span></div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-600" style={{ width: `${Math.min(100, (nodesCount / Math.max(1, openDrifts.length)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Workloads</span><span>{workloadsCount}</span></div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-600" style={{ width: `${Math.min(100, (workloadsCount / Math.max(1, openDrifts.length)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Other</span><span>{otherCount}</span></div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-500" style={{ width: `${Math.min(100, (otherCount / Math.max(1, openDrifts.length)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability management */}
        <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vulnerability management</CardTitle>
            <CardDescription>Vulnerabilities by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-rose-200/60 dark:border-rose-800/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">Critical</div>
                <div className="text-2xl font-bold">{criticalAlertsCount}</div>
                <div className="text-[11px] text-muted-foreground">alerts</div>
              </div>
              <div className="rounded-lg border border-amber-200/60 dark:border-amber-800/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">High</div>
                <div className="text-2xl font-bold">{highAlertsCount}</div>
                <div className="text-[11px] text-muted-foreground">alerts</div>
              </div>
              <div className="rounded-lg border border-yellow-200/60 dark:border-yellow-800/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">Medium</div>
                <div className="text-2xl font-bold">{mediumAlertsCount}</div>
                <div className="text-[11px] text-muted-foreground">alerts</div>
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground mb-2">Most vulnerable image repositories</div>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Repository</th>
                    <th className="px-3 py-2 text-center">C</th>
                    <th className="px-3 py-2 text-center">H</th>
                    <th className="px-3 py-2 text-center">M</th>
                    <th className="px-3 py-2 text-right">Fixes</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {repoList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No repositories detected</td>
                    </tr>
                  ) : (
                    repoList.map((r) => (
                      <tr key={r.name}>
                        <td className="px-3 py-2 text-blue-600 dark:text-blue-400 truncate max-w-[260px]">{r.name}</td>
                        <td className="px-3 py-2 text-center">{r.critical}</td>
                        <td className="px-3 py-2 text-center">{r.high}</td>
                        <td className="px-3 py-2 text-center">{r.medium}</td>
                        <td className="px-3 py-2 text-right">{r.fixes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-right text-sm text-blue-600 dark:text-blue-400 cursor-pointer">Report →</div>
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
