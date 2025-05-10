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
  AlertTriangle 
} from "lucide-react";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/utils";

export default function SecurityMonitoring() {
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("drifts");
  const [alertType, setAlertType] = useState<string>("all");
  const [alertSeverity, setAlertSeverity] = useState<string>("all");
  const [alertStatus, setAlertStatus] = useState<string>("all");

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
          drift.driftType.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSeverity && matchesStatus && matchesSearch;
      })
    : [];

  // Summary counts
  const criticalCount = securityDrifts?.filter(d => d.severity === 'critical').length || 0;
  const highCount = securityDrifts?.filter(d => d.severity === 'high').length || 0;
  const mediumCount = securityDrifts?.filter(d => d.severity === 'medium').length || 0;
  const openCount = securityDrifts?.filter(d => d.status === 'open').length || 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold font-inter mb-1">Security Monitoring</h1>
        <p className="text-gray-500">
          Monitor and remediate security configuration drifts across your cloud infrastructure
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
                <ShieldOff className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">High Severity</p>
                <p className="text-2xl font-bold">{highCount}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">{mediumCount} medium severity</p>
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
                <p className="text-sm text-gray-500">Open Issues</p>
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
      <Tabs defaultValue="drifts" className="mb-6" onValueChange={(value) => setActiveTab(value)}>
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
                placeholder="Search resources or drift types..."
                className="pl-9 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Select
                value={severity}
                onValueChange={setSeverity}
              >
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="All Severities" />
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
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="remediated">Remediated</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
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
                        <TableCell>{formatTimeAgo(drift.detectedAt)}</TableCell>
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
        
        {/* Other tab contents would be similar */}
        <TabsContent value="critical" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Critical Security Issues</CardTitle>
              <CardDescription>
                All critical security configuration drifts that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Similar table but filtered for critical */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
