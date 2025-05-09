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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceUtilization } from "@/components/dashboard/ResourceUtilization";
import { UtilizationCharts } from "@/components/dashboard/UtilizationCharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { Resource, UtilizationMetric } from "@/types";
import { 
  BarChart3, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";

export default function ResourceUtilizationPage() {
  const [resourceType, setResourceType] = useState("all");
  const [provider, setProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch resources
  const { data: resources, isLoading: isLoadingResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Sample resource utilization metrics (would come from API in real app)
  const utilizationMetrics: UtilizationMetric[] = [
    {
      name: "CPU Utilization",
      value: 38,
      status: "healthy",
      trend: "down",
      change: 12,
    },
    {
      name: "Memory Usage",
      value: 72,
      status: "warning",
      trend: "up",
      change: 18,
    },
    {
      name: "Storage Usage",
      value: 54,
      status: "healthy",
      trend: "down",
      change: 3,
    },
    {
      name: "Network I/O",
      value: 89,
      status: "critical",
      trend: "up",
      change: 43,
    },
  ];

  // Filter resources based on criteria
  const filteredResources = resources
    ? resources.filter((resource) => {
        const matchesType = resourceType === "all" || resource.type === resourceType;
        const matchesProvider = provider === "all" || resource.provider === provider;
        const matchesSearch =
          searchQuery === "" ||
          resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.region.toLowerCase().includes(searchQuery.toLowerCase());
          
        return matchesType && matchesProvider && matchesSearch;
      })
    : [];

  // Get unique resource types and providers for filters
  const resourceTypes = resources
    ? Array.from(new Set(resources.map((r) => r.type)))
    : [];
  
  const providers = resources
    ? Array.from(new Set(resources.map((r) => r.provider)))
    : [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Resource Utilization"
        description="Monitor and optimize resource usage across cloud providers"
        actions={
          <Button className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Metrics
          </Button>
        }
      />

      {/* Resource Utilization Summary */}
      <div className="mb-6">
        <ResourceUtilization 
          metrics={utilizationMetrics} 
          isLoading={false} 
        />
      </div>

      {/* Utilization Charts */}
      <div className="mb-6">
        <UtilizationCharts />
      </div>

      {/* Resources List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cloud Resources</CardTitle>
          <CardDescription>
            All cloud resources across providers with utilization metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search resources..."
                  className="pl-9 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Select
                  value={resourceType}
                  onValueChange={setResourceType}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={provider}
                  onValueChange={setProvider}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Monthly Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingResources ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Loading resources...
                    </TableCell>
                  </TableRow>
                ) : filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No resources found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>{resource.provider}</TableCell>
                      <TableCell>{resource.region}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          resource.status === "running" || resource.status === "active"
                            ? "bg-secondary bg-opacity-10 text-secondary"
                            : "bg-warning bg-opacity-10 text-warning"
                        }`}>
                          {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {resource.type === "EC2" ? (
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `38%` }}
                              ></div>
                            </div>
                            <span className="text-xs">38%</span>
                          </div>
                        ) : resource.type === "RDS" ? (
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-full bg-warning rounded-full"
                                style={{ width: `72%` }}
                              ></div>
                            </div>
                            <span className="text-xs">72%</span>
                          </div>
                        ) : resource.type === "S3" ? (
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `54%` }}
                              ></div>
                            </div>
                            <span className="text-xs">54%</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `45%` }}
                              ></div>
                            </div>
                            <span className="text-xs">45%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(resource.cost)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-primary hover:text-primary/80"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resource Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Optimization Recommendations</CardTitle>
          <CardDescription>
            Suggestions to improve resource utilization and reduce costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="text-base font-medium mb-1">
                    Rightsize under-utilized instances
                  </h3>
                  <p className="text-sm text-gray-500">
                    6 EC2 instances with &lt;20% CPU utilization over the past 14 days
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-secondary font-semibold mb-1">
                    {formatCurrency(84000)}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    Potential savings
                  </div>
                </div>
              </div>
              <Button 
                className="px-4 py-2 bg-primary text-white text-sm font-medium"
              >
                View Affected Resources
              </Button>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="text-base font-medium mb-1">
                    Consolidate RDS database instances
                  </h3>
                  <p className="text-sm text-gray-500">
                    2 RDS instances with low utilization could be consolidated
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-secondary font-semibold mb-1">
                    {formatCurrency(56000)}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    Potential savings
                  </div>
                </div>
              </div>
              <Button 
                className="px-4 py-2 bg-primary text-white text-sm font-medium"
              >
                View Affected Resources
              </Button>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="text-base font-medium mb-1">
                    Optimize network traffic paths
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cross-region traffic can be optimized to reduce costs
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-secondary font-semibold mb-1">
                    {formatCurrency(32000)}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    Potential savings
                  </div>
                </div>
              </div>
              <Button 
                className="px-4 py-2 bg-primary text-white text-sm font-medium"
              >
                View Optimization Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
