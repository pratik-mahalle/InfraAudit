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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceUtilization } from "@/components/dashboard/ResourceUtilization";
import { UtilizationCharts } from "@/components/dashboard/UtilizationCharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { UtilizationMetric } from "@/types";
import { useResources } from "@/hooks/use-resources";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
} from "lucide-react";

export default function ResourceUtilizationPage() {
  const [resourceType, setResourceType] = useState("all");
  const [provider, setProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch resources from Go backend (paginated response)
  const { data: resourcesResponse, isLoading: isLoadingResources } = useResources();
  const resources = resourcesResponse?.data ?? [];

  // Fetch recommendations for the optimization section
  const { data: recommendationsResponse } = useQuery<any>({
    queryKey: ["/api/recommendations"],
  });
  const recommendations = Array.isArray(recommendationsResponse) 
    ? recommendationsResponse 
    : (recommendationsResponse?.data ?? []);

  // Derive real utilization metrics from actual resource data
  const resourceCount = resources.length;
  const runningCount = resources.filter(r => r.status === "running" || r.status === "active").length;
  const stoppedCount = resources.filter(r => r.status === "stopped" || r.status === "inactive").length;
  const activePercent = resourceCount > 0 ? Math.round((runningCount / resourceCount) * 100) : 0;
  const healthPercent = resourceCount > 0 ? Math.round(((resourceCount - stoppedCount) / resourceCount) * 100) : 0;

  // Group by provider for distribution
  const providerCounts: Record<string, number> = {};
  resources.forEach(r => { providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1; });
  const typeCounts: Record<string, number> = {};
  resources.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });

  const utilizationMetrics: UtilizationMetric[] = [
    {
      name: "Active Resources",
      value: activePercent,
      status: activePercent > 80 ? "healthy" : activePercent > 50 ? "warning" : "critical",
      trend: activePercent >= 50 ? "up" : "down",
      change: runningCount,
    },
    {
      name: "Health Score",
      value: healthPercent,
      status: healthPercent > 80 ? "healthy" : healthPercent > 50 ? "warning" : "critical",
      trend: healthPercent >= 80 ? "up" : "down",
      change: resourceCount - stoppedCount,
    },
    {
      name: "Total Resources",
      value: resourceCount,
      status: "healthy",
      trend: "up",
      change: resourceCount,
    },
    {
      name: "Providers",
      value: Object.keys(providerCounts).length,
      status: "healthy",
      trend: "up",
      change: Object.keys(providerCounts).length,
    },
  ];

  // Filter resources based on criteria
  const filteredResources = resources.filter((resource) => {
    const matchesType = resourceType === "all" || resource.type === resourceType;
    const matchesProvider = provider === "all" || resource.provider === provider;
    const matchesSearch =
      searchQuery === "" ||
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.region.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesProvider && matchesSearch;
  });

  // Get unique resource types and providers for filters
  const resourceTypes = Array.from(new Set(resources.map((r) => r.type)));
  const providers = Array.from(new Set(resources.map((r) => r.provider)));

  // Show real status-based indicator per resource (no fake utilization without real metrics API)
  const getResourceUtilization = (resource: any): { value: number; color: string; label: string } => {
    if (resource.status === "running" || resource.status === "active") {
      return { value: 100, color: "bg-emerald-500", label: "Active" };
    } else if (resource.status === "stopped" || resource.status === "inactive") {
      return { value: 0, color: "bg-gray-400", label: "Stopped" };
    } else {
      return { value: 50, color: "bg-amber-500", label: resource.status };
    }
  };

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
          isLoading={isLoadingResources}
        />
      </div>

      {/* Utilization Charts */}
      <div className="mb-6">
        <UtilizationCharts resources={resources} />
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
                    {providers.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
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
                  <TableHead>Health</TableHead>
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
                  filteredResources.map((resource) => {
                    const util = getResourceUtilization(resource);
                    return (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>{resource.provider}</TableCell>
                        <TableCell>{resource.region}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            resource.status === "running" || resource.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${util.color}`}></div>
                            <span className="text-xs">{util.label}</span>
                          </div>
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resource Recommendations — from real API */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Optimization Recommendations</CardTitle>
          <CardDescription>
            Suggestions to improve resource utilization and reduce costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 5).map((rec: any) => (
                <div key={rec.id} className="border border-gray-300 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="text-base font-medium mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-500">{rec.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-600 font-semibold mb-1">
                        {formatCurrency((rec as any).savings || (rec as any).estimatedSavings || 0)}/mo
                      </div>
                      <div className="text-xs text-gray-500">Potential savings</div>
                    </div>
                  </div>
                  <Button className="px-4 py-2 bg-primary text-white text-sm font-medium">
                    View Details
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No optimization recommendations yet.</p>
                <p className="text-xs mt-1">Connect cloud providers and run a scan to get recommendations.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
