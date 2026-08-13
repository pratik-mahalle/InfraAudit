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
import { formatResourceType } from "@/lib/resource-display";
import { UtilizationMetric } from "@/types";
import { useRefreshResourceMetrics, useResources } from "@/hooks/use-resources";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Activity,
  DollarSign,
  ExternalLink,
  Layers3,
  MapPin,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";
import { DetailRow, EmptyPanel, ToneBadge } from "@/components/security-ops/ops-ui";

export default function ResourceUtilizationPage() {
  const [resourceType, setResourceType] = useState("all");
  const [provider, setProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResourceKey, setSelectedResourceKey] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const refreshMetrics = useRefreshResourceMetrics();

  // Fetch resources from Go backend (paginated response)
  const { data: resourcesResponse, isLoading: isLoadingResources, isError: isResourcesError, error: resourcesError } = useResources({ page: 1, pageSize: 100 });
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
  const resourceKey = (resource: any) => String(resource.resourceId ?? resource.id ?? resource.name);
  const selectedResource = filteredResources.find((resource) => resourceKey(resource) === selectedResourceKey) ?? filteredResources[0] ?? null;
  const regionCounts = resources.reduce<Record<string, number>>((counts, resource) => {
    counts[resource.region || "unknown"] = (counts[resource.region || "unknown"] ?? 0) + 1;
    return counts;
  }, {});
  const providerEntries = Object.entries(providerCounts).sort((a, b) => b[1] - a[1]);
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const regionEntries = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);

  // Get unique resource types and providers for filters
  const resourceTypes = Array.from(new Set(resources.map((r) => r.type)));
  const providers = Array.from(new Set(resources.map((r) => r.provider)));

  const statusTone = (status?: string) => {
    if (status === "running" || status === "active") return "emerald" as const;
    if (status === "stopped" || status === "inactive") return "slate" as const;
    return "amber" as const;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Cloud Resources"
        description="Search, inspect, and refresh the live infrastructure inventory"
        actions={
          <Button
            className="flex items-center gap-2"
            disabled={refreshMetrics.isPending}
            onClick={() => refreshMetrics.mutate(undefined, {
              onSuccess: (providerCount) => toast({
                title: "Metrics refreshed",
                description: `Synced ${providerCount} connected cloud provider${providerCount === 1 ? "" : "s"}.`,
              }),
              onError: (error: Error) => toast({
                title: "Refresh failed",
                description: error.message,
                variant: "destructive",
              }),
            })}
          >
            <RefreshCw className={`h-4 w-4 ${refreshMetrics.isPending ? "animate-spin" : ""}`} />
            {refreshMetrics.isPending ? "Refreshing..." : "Refresh Metrics"}
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

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Provider Spread
            </CardTitle>
            <CardDescription>Inventory grouped by connected cloud</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {providerEntries.map(([name, count]) => (
              <button key={name} type="button" onClick={() => setProvider(name)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                <span className="text-sm uppercase">{name}</span>
                <ToneBadge value={count} tone="blue" />
              </button>
            ))}
            {providerEntries.length === 0 && <p className="text-sm text-muted-foreground">No providers have synced resources yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5" />
              Resource Classes
            </CardTitle>
            <CardDescription>Most common infrastructure types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {typeEntries.slice(0, 5).map(([type, count]) => (
              <button key={type} type="button" onClick={() => setResourceType(type)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                <span className="truncate text-sm">{formatResourceType(type)}</span>
                <ToneBadge value={count} tone="slate" />
              </button>
            ))}
            {typeEntries.length === 0 && <p className="text-sm text-muted-foreground">No resource classes available.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regions
            </CardTitle>
            <CardDescription>Where inventory is currently running</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {regionEntries.slice(0, 5).map(([region, count]) => (
              <button key={region} type="button" onClick={() => setSearchQuery(region)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                <span className="truncate text-sm">{region}</span>
                <ToneBadge value={count} tone="amber" />
              </button>
            ))}
            {regionEntries.length === 0 && <p className="text-sm text-muted-foreground">No region data available.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inventory Atlas</CardTitle>
          <CardDescription>
            Select an asset to inspect ownership, runtime status, cost, and provider context
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
                      <SelectItem key={type} value={type}>{formatResourceType(type)}</SelectItem>
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            {isLoadingResources ? (
              <EmptyPanel icon={Server} title="Loading resources" description="Fetching provider-native inventory." />
            ) : isResourcesError ? (
              <EmptyPanel icon={AlertTriangle} title="Could not load resources" description={resourcesError instanceof Error ? resourcesError.message : "Failed to load resources."} />
            ) : filteredResources.length === 0 ? (
              <EmptyPanel icon={Search} title="No resources found" description="Change filters or refresh metrics to update inventory." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredResources.map((resource) => {
                  const key = resourceKey(resource);
                  const selected = selectedResource && resourceKey(selectedResource) === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedResourceKey(key)}
                      className={`rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 ${selected ? "border-primary/50 bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{resource.name}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{formatResourceType(resource.type)}</p>
                        </div>
                        <ToneBadge value={resource.status} tone={statusTone(resource.status)} />
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                        <span>{resource.provider.toUpperCase()} · {resource.region}</span>
                        <span className="font-mono">{resource.resourceId ?? `resource-${resource.id}`}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">Monthly cost</span>
                        <span className="text-sm font-medium">{resource.cost == null ? "Unknown" : formatCurrency(resource.cost)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Asset Detail</CardTitle>
                <CardDescription>Selected resource context and next actions</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedResource ? (
                  <EmptyPanel icon={Server} title="No resource selected" description="Select an asset from the atlas to inspect provider context." />
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <ToneBadge value={selectedResource.provider} tone="blue" />
                        <ToneBadge value={selectedResource.status} tone={statusTone(selectedResource.status)} />
                      </div>
                      <h3 className="text-lg font-semibold">{selectedResource.name}</h3>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{selectedResource.resourceId ?? `resource-${selectedResource.id}`}</p>
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Type">{formatResourceType(selectedResource.type)}</DetailRow>
                      <DetailRow label="Region">{selectedResource.region || "Unknown"}</DetailRow>
                      <DetailRow label="Cost">{selectedResource.cost == null ? "Unknown" : formatCurrency(selectedResource.cost)}</DetailRow>
                      <DetailRow label="Updated">{selectedResource.updatedAt ? new Date(selectedResource.updatedAt).toLocaleString() : "Unknown"}</DetailRow>
                    </dl>
                    <div className="grid gap-2">
                      <Button className="gap-2" onClick={() => navigate(`/resources/${encodeURIComponent(selectedResource.resourceId ?? String(selectedResource.id))}`)}>
                        <ExternalLink className="h-4 w-4" />
                        Open Full Resource
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => navigate(`/drift-detection?resource=${encodeURIComponent(selectedResource.resourceId ?? String(selectedResource.id))}`)}>
                        <Activity className="h-4 w-4" />
                        Review Drift
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => navigate("/cost")}>
                        <DollarSign className="h-4 w-4" />
                        Cost Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <Button
                    className="px-4 py-2 bg-primary text-white text-sm font-medium"
                    onClick={() => navigate("/recommendations")}
                  >
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
