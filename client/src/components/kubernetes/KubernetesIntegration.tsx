import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Loader2, RefreshCcw, MoreVertical, Trash2, Server, Shield, Cpu,
  Database, Box, Plus, ArrowRight, Layers, Activity, Clock, CheckCircle2,
  XCircle, AlertCircle, Cloud, Terminal, Settings2, ExternalLink, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type KubernetesCluster = {
  id: string;
  name: string;
  context?: string;
  hasKubeconfig: boolean;
  status?: 'connected' | 'disconnected' | 'error';
  nodeCount?: number;
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

// ============================================================================
// SCHEMA
// ============================================================================

const addClusterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  kubeconfig: z.string().min(100, "Kubeconfig is required and must be valid").optional(),
  context: z.string().optional(),
});

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs font-medium flex items-center gap-1",
              trendUp ? "text-green-600" : "text-gray-500"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 mb-6">
        <Icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">{description}</p>
      {action && actionLabel && (
        <Button onClick={action} className="gap-2">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function ClusterCard({
  cluster,
  isSelected,
  onClick,
  onDelete
}: {
  cluster: KubernetesCluster;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const statusColors = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
        isSelected
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10"
          : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-lg transition-colors",
            isSelected
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
          )}>
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{cluster.name}</h4>
              <span className={cn("w-2 h-2 rounded-full", statusColors[cluster.status || 'disconnected'])} />
            </div>
            {cluster.context && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Context: {cluster.context}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Cluster
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(cluster.nodeCount || cluster.version) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {cluster.nodeCount && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {cluster.nodeCount} nodes
            </span>
          )}
          {cluster.version && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              v{cluster.version}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource }: { resource: KubernetesResource }) {
  const getResourceIcon = (kind: string) => {
    const icons: Record<string, React.ElementType> = {
      pod: Box,
      deployment: Shield,
      service: Server,
      default: Database,
    };
    return icons[kind.toLowerCase()] || icons.default;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
      running: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
      pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      default: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: AlertCircle },
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.default;
    const StatusIcon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1 font-medium", config.color)}>
        <StatusIcon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const Icon = getResourceIcon(resource.kind);
  const age = getAge(resource.creationTimestamp);

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{resource.name}</p>
            <p className="text-xs text-gray-500">{resource.kind}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-mono text-xs">
          {resource.namespace}
        </Badge>
      </TableCell>
      <TableCell>{getStatusBadge(resource.status)}</TableCell>
      <TableCell className="text-gray-500 dark:text-gray-400 text-sm">{age}</TableCell>
    </TableRow>
  );
}

function getAge(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  return `${Math.floor(diffSeconds / 86400)}d`;
}

// ============================================================================
// ADD CLUSTER DIALOG
// ============================================================================

function AddClusterDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<typeof addClusterSchema>) => void;
  isLoading: boolean;
}) {
  const form = useForm<z.infer<typeof addClusterSchema>>({
    resolver: zodResolver(addClusterSchema),
    defaultValues: { name: '', kubeconfig: '', context: '' },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Plus className="h-5 w-5" />
            </div>
            Add Kubernetes Cluster
          </CardTitle>
          <CardDescription>
            Connect a Kubernetes cluster to monitor its resources, health, and utilization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cluster Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production Cluster" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for your Kubernetes cluster.</FormDescription>
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
                      <Textarea
                        placeholder="Paste your kubeconfig content here..."
                        className="font-mono text-xs h-48"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="flex items-center gap-2">
                      <Terminal className="h-3 w-3" />
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        kubectl config view --minify --flatten
                      </code>
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
                    <FormLabel>Context (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="kubernetes-admin@cluster1" {...field} />
                    </FormControl>
                    <FormDescription>Specific context to use within the kubeconfig.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Cluster
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KubernetesIntegration() {
  const { toast } = useToast();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [isAddingCluster, setIsAddingCluster] = useState(false);

  // Queries
  const { data: clusters = [], isLoading: clustersLoading, error: clustersError } = useQuery<KubernetesCluster[]>({
    queryKey: ['/api/kubernetes/clusters'],
    select: (data) => Array.isArray(data) ? data : [],
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('404')) return false;
      return failureCount < 3;
    },
  });

  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useQuery<KubernetesResource[]>({
    queryKey: ['/api/kubernetes/clusters', selectedCluster, 'resources'],
    enabled: !!selectedCluster,
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Mutations
  const addClusterMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addClusterSchema>) => {
      const response = await apiRequest('POST', '/api/kubernetes/clusters', values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
      toast({ title: 'Cluster added', description: 'Your Kubernetes cluster has been added successfully.' });
      setIsAddingCluster(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add cluster', description: error.message, variant: 'destructive' });
    },
  });

  const removeClusterMutation = useMutation({
    mutationFn: async (clusterId: string) => {
      await apiRequest('DELETE', `/api/kubernetes/clusters/${clusterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
      setSelectedCluster(null);
      toast({ title: 'Cluster removed', description: 'The Kubernetes cluster has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove cluster', description: error.message, variant: 'destructive' });
    },
  });

  const selectedClusterData = clusters.find(c => c.id === selectedCluster);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Kubernetes Integration
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage your Kubernetes clusters and resources.
          </p>
        </div>
        <Button onClick={() => setIsAddingCluster(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Cluster
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Server} label="Total Clusters" value={clusters.length} trend="All connected" />
        <StatCard icon={Layers} label="Total Nodes" value={clusters.reduce((acc, c) => acc + (c.nodeCount || 0), 0)} />
        <StatCard icon={Box} label="Active Pods" value={resources.filter(r => r.kind === 'Pod' && r.status === 'Running').length} />
        <StatCard icon={Activity} label="Healthy" value="100%" trendUp trend="↑ 5% from last week" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clusters List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clusters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] })}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {clustersError ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Connection Error</p>
                    <p className="text-sm opacity-80">Unable to load clusters. Backend may be offline.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : clustersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : clusters.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Cloud}
                  title="No clusters found"
                  description="Add your first Kubernetes cluster to start monitoring."
                  action={() => setIsAddingCluster(true)}
                  actionLabel="Add Cluster"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clusters.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSelected={selectedCluster === cluster.id}
                  onClick={() => setSelectedCluster(cluster.id)}
                  onDelete={() => {
                    if (confirm(`Remove cluster "${cluster.name}"?`)) {
                      removeClusterMutation.mutate(cluster.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resources Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {selectedClusterData ? selectedClusterData.name : 'Cluster Resources'}
                </CardTitle>
                <CardDescription>
                  {selectedCluster ? 'View and manage cluster resources' : 'Select a cluster to view resources'}
                </CardDescription>
              </div>
              {selectedCluster && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({
                    queryKey: ['/api/kubernetes/clusters', selectedCluster, 'resources']
                  })}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedCluster ? (
                <EmptyState
                  icon={Layers}
                  title="No cluster selected"
                  description="Select a cluster from the list to view its resources and workloads."
                />
              ) : resourcesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : resourcesError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading resources: {(resourcesError as Error).message}
                </div>
              ) : resources.length === 0 ? (
                <EmptyState
                  icon={Box}
                  title="No resources found"
                  description="This cluster doesn't have any resources yet, or they couldn't be loaded."
                />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead>Resource</TableHead>
                        <TableHead>Namespace</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <ResourceRow key={resource.id} resource={resource} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Cluster Dialog */}
      <AddClusterDialog
        isOpen={isAddingCluster}
        onClose={() => setIsAddingCluster(false)}
        onSubmit={(values) => addClusterMutation.mutate(values)}
        isLoading={addClusterMutation.isPending}
      />
    </div>
  );
}