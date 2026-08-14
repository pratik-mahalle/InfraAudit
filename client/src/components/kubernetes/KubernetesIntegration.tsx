import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertCircle,
  Box,
  CheckCircle2,
  Database,
  Layers,
  Loader2,
  Plus,
  RefreshCcw,
  Server,
  Shield,
  Terminal,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, unwrapResponse } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
import { KubernetesAgentConnectors } from "@/components/kubernetes/KubernetesAgentConnectors";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

type KubernetesCluster = {
  id: number;
  name: string;
  context?: string;
  hasKubeconfig: boolean;
  status?: "connected" | "disconnected" | "error";
  nodeCount?: number;
  nodes?: number;
  version?: string;
};

type KubernetesResource = {
  id: string;
  name: string;
  namespace: string;
  kind: string;
  creationTimestamp: string;
  status: string;
  cpu?: { requests?: string; limits?: string };
  memory?: { requests?: string; limits?: string };
  podCount?: number;
};

const addClusterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  kubeconfig: z.string().min(100, "Kubeconfig is required and must be valid").optional(),
  context: z.string().optional(),
});

function getAge(timestamp: string): string {
  const date = new Date(timestamp);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(diffSeconds)) return "Unknown";
  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  return `${Math.floor(diffSeconds / 86400)}d`;
}

function resourceIcon(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized.includes("pod")) return Box;
  if (normalized.includes("deployment")) return Shield;
  if (normalized.includes("service")) return Server;
  if (normalized.includes("node")) return Layers;
  return Database;
}

function AddClusterDialog({
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<typeof addClusterSchema>) => void;
}) {
  const form = useForm<z.infer<typeof addClusterSchema>>({
    resolver: zodResolver(addClusterSchema),
    defaultValues: { name: "", kubeconfig: "", context: "" },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl rounded-lg">
        <CardHeader>
          <CardTitle>Add Kubernetes Cluster</CardTitle>
          <CardDescription>Paste a kubeconfig so InfraAudit can inventory namespaces, workloads, and services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cluster name</FormLabel>
                    <FormControl>
                      <Input placeholder="production-us-east" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kubeconfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kubeconfig</FormLabel>
                    <FormControl>
                      <Textarea className="h-48 font-mono text-xs" placeholder="apiVersion: v1..." {...field} />
                    </FormControl>
                    <FormDescription className="flex items-center gap-2">
                      <Terminal className="h-3 w-3" />
                      kubectl config view --minify --flatten
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context</FormLabel>
                    <FormControl>
                      <Input placeholder="kubernetes-admin@cluster" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Cluster
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export function KubernetesIntegration() {
  const { toast } = useToast();
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [isAddingCluster, setIsAddingCluster] = useState(false);

  const { data: clusters = [], isLoading: clustersLoading, error: clustersError } = useQuery<KubernetesCluster[]>({
    queryKey: ["/api/kubernetes/clusters"],
    select: (data) => (Array.isArray(data) ? data : []),
    retry: (failureCount, error: any) => (error?.message?.includes("404") ? false : failureCount < 3),
  });

  useEffect(() => {
    if (!selectedCluster && clusters.length > 0) {
      setSelectedCluster(clusters[0].id);
    }
  }, [clusters, selectedCluster]);

  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useQuery<KubernetesResource[]>({
    queryKey: ["/api/kubernetes/clusters", selectedCluster, "resources"],
    enabled: !!selectedCluster,
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(`${API_BASE}/api/kubernetes/clusters/${selectedCluster}/resources`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return unwrapResponse<KubernetesResource[]>(await response.json());
    },
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const addClusterMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addClusterSchema>) => {
      const response = await apiRequest("POST", "/api/kubernetes/clusters", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kubernetes/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsAddingCluster(false);
      toast({ title: "Cluster added", description: "Kubernetes inventory will be available after sync." });
    },
    onError: (error: Error) => toast({ title: "Failed to add cluster", description: error.message, variant: "destructive" }),
  });

  const removeClusterMutation = useMutation({
    mutationFn: async (clusterId: number) => {
      await apiRequest("DELETE", `/api/kubernetes/clusters/${clusterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kubernetes/clusters"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setSelectedCluster(null);
      toast({ title: "Cluster removed", description: "The cluster was removed from inventory." });
    },
    onError: (error: Error) => toast({ title: "Failed to remove cluster", description: error.message, variant: "destructive" }),
  });

  const syncClusterMutation = useMutation({
    mutationFn: async (clusterId: number) => {
      await apiRequest("POST", `/api/kubernetes/clusters/${clusterId}/sync`);
    },
    onSuccess: async (_data, clusterId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/kubernetes/clusters"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/kubernetes/clusters", clusterId, "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
      ]);
      toast({ title: "Cluster synced", description: "Kubernetes resources were refreshed." });
    },
    onError: (error: Error) => toast({ title: "Sync failed", description: error.message, variant: "destructive" }),
  });

  const selectedClusterData = clusters.find((cluster) => cluster.id === selectedCluster);
  const nodeCount = clusters.reduce((sum, cluster) => sum + (cluster.nodes || cluster.nodeCount || 0), 0);
  const namespaces = useMemo(() => Array.from(new Set(resources.map((resource) => resource.namespace))).sort(), [resources]);
  const runningPods = resources.filter((resource) => resource.kind.toLowerCase() === "pod" && resource.status.toLowerCase() === "running").length;
  const unhealthyResources = resources.filter((resource) => !["running", "active", "ready", "succeeded"].includes(resource.status.toLowerCase())).length;
  const resourcesByKind = resources.reduce<Record<string, number>>((acc, resource) => {
    acc[resource.kind] = (acc[resource.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Kubernetes Operations"
        description="Inventory public and private clusters, inspect workloads, and retain collection history."
        actions={
          <Button onClick={() => setIsAddingCluster(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Direct Cluster
          </Button>
        }
      />

      <KubernetesAgentConnectors />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Server} label="Clusters" value={clusters.length} tone="blue" helper={`${clusters.filter((cluster) => cluster.status === "connected").length} connected`} />
        <MetricTile icon={Layers} label="Nodes" value={nodeCount} tone="slate" helper="Across clusters" />
        <MetricTile icon={Box} label="Running pods" value={runningPods} tone="emerald" helper={`${resources.length} resources loaded`} />
        <MetricTile icon={AlertCircle} label="Needs attention" value={unhealthyResources} tone={unhealthyResources > 0 ? "amber" : "emerald"} helper="Non-ready resources" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Clusters</CardTitle>
              <CardDescription>Select a cluster to inspect workloads</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/kubernetes/clusters"] })}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {clustersError ? (
              <EmptyPanel icon={AlertCircle} title="Cluster API unavailable" description="Unable to load Kubernetes clusters from the backend." />
            ) : clustersLoading ? (
              <EmptyPanel icon={Loader2} title="Loading clusters" description="Fetching connected Kubernetes clusters." />
            ) : clusters.length === 0 ? (
              <EmptyPanel
                icon={Server}
                title="No clusters connected"
                description="Add a kubeconfig to start tracking namespaces, workloads, and services."
                action={<Button onClick={() => setIsAddingCluster(true)}>Add Cluster</Button>}
              />
            ) : (
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSelectedCluster(cluster.id)}
                    className={cn("w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50", selectedCluster === cluster.id && "border-primary bg-muted")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">{cluster.name}</h3>
                          <ToneBadge value={cluster.status || "disconnected"} />
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{cluster.context || "No context label"}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (confirm(`Remove cluster "${cluster.name}"?`)) {
                            removeClusterMutation.mutate(cluster.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{cluster.nodes || cluster.nodeCount || 0} nodes</span>
                      {cluster.version && <span>{cluster.version.startsWith("v") ? cluster.version : `v${cluster.version}`}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{selectedClusterData?.name || "Cluster Detail"}</CardTitle>
              <CardDescription>{selectedCluster ? "Namespaces, workload health, and resource inventory" : "Select a cluster to view details"}</CardDescription>
            </div>
            {selectedCluster && (
              <Button variant="outline" size="sm" disabled={syncClusterMutation.isPending} onClick={() => syncClusterMutation.mutate(selectedCluster)} className="gap-2">
                <RefreshCcw className={`h-4 w-4 ${syncClusterMutation.isPending ? "animate-spin" : ""}`} />
                Sync
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCluster ? (
              <EmptyPanel icon={Layers} title="No cluster selected" description="Select a cluster from the left panel to inspect its resources." />
            ) : resourcesLoading ? (
              <EmptyPanel icon={Loader2} title="Loading resources" description="Fetching Kubernetes workloads and services." />
            ) : resourcesError ? (
              <EmptyPanel icon={AlertCircle} title="Resources unavailable" description={(resourcesError as Error).message} />
            ) : (
              <Tabs defaultValue="workloads">
                <TabsList>
                  <TabsTrigger value="workloads">Workloads</TabsTrigger>
                  <TabsTrigger value="namespaces">Namespaces</TabsTrigger>
                  <TabsTrigger value="health">Health</TabsTrigger>
                </TabsList>

                <TabsContent value="workloads" className="mt-4">
                  {resources.length === 0 ? (
                    <EmptyPanel icon={Box} title="No resources found" description="Sync the cluster to load current Kubernetes resources." />
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Resource</TableHead>
                            <TableHead>Namespace</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Age</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resources.map((resource) => {
                            const Icon = resourceIcon(resource.kind);
                            return (
                              <TableRow key={resource.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-md border bg-muted/50 p-2">
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{resource.name}</p>
                                      <p className="text-xs text-muted-foreground">{resource.kind}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{resource.namespace}</TableCell>
                                <TableCell>
                                  <ToneBadge value={resource.status} />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{getAge(resource.creationTimestamp)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="namespaces" className="mt-4">
                  {namespaces.length === 0 ? (
                    <EmptyPanel icon={Database} title="No namespaces found" description="No namespace data was returned for this cluster." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {namespaces.map((namespace) => (
                        <div key={namespace} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-sm font-medium">{namespace}</p>
                            <ToneBadge value={resources.filter((resource) => resource.namespace === namespace).length} tone="blue" />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Resources in namespace</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="health" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-base">Resource Mix</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(resourcesByKind).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No resource distribution available.</p>
                        ) : (
                          Object.entries(resourcesByKind).map(([kind, count]) => (
                            <div key={kind} className="flex items-center justify-between rounded-lg border p-3">
                              <span className="text-sm">{kind}</span>
                              <ToneBadge value={count} tone="blue" />
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-base">Runtime Health</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium">{runningPods} running pods</p>
                            <p className="text-xs text-muted-foreground">Ready pod inventory</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <Activity className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium">{unhealthyResources} resources need attention</p>
                            <p className="text-xs text-muted-foreground">Non-ready or unknown status</p>
                          </div>
                        </div>
                        <Separator />
                        <p className="text-sm text-muted-foreground">
                          Sync the cluster after deployments or node changes to keep InfraAudit inventory current.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <AddClusterDialog
        isOpen={isAddingCluster}
        isLoading={addClusterMutation.isPending}
        onClose={() => setIsAddingCluster(false)}
        onSubmit={(values) => addClusterMutation.mutate(values)}
      />
    </div>
  );
}
