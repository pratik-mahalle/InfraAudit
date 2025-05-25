import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Loader2, RefreshCcw, MoreVertical, Trash2, Server, Shield, Cpu, Database, Box } from 'lucide-react';

// Schema for adding a Kubernetes cluster
const addClusterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  kubeconfig: z.string().min(100, "Kubeconfig is required and must be valid").optional(),
  context: z.string().optional(),
});

type KubernetesCluster = {
  id: string;
  name: string;
  context?: string;
  hasKubeconfig: boolean;
};

type KubernetesResource = {
  id: string;
  name: string;
  namespace: string;
  kind: string;
  creationTimestamp: string;
  status: string;
  cpu?: {
    requests?: string;
    limits?: string;
  };
  memory?: {
    requests?: string;
    limits?: string;
  };
  podCount?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  clusterName: string;
};

export function KubernetesIntegration() {
  const { toast } = useToast();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [isAddingCluster, setIsAddingCluster] = useState(false);

  // Form for adding a Kubernetes cluster
  const form = useForm<z.infer<typeof addClusterSchema>>({
    resolver: zodResolver(addClusterSchema),
    defaultValues: {
      name: '',
      kubeconfig: '',
      context: '',
    },
  });

  // Query to fetch all Kubernetes clusters
  const { 
    data: clusters = [], 
    isLoading: clustersLoading,
    error: clustersError
  } = useQuery<KubernetesCluster[]>({
    queryKey: ['/api/kubernetes/clusters'],
  });

  // Query to fetch resources for the selected cluster
  const {
    data: resources = [],
    isLoading: resourcesLoading,
    error: resourcesError
  } = useQuery<KubernetesResource[]>({
    queryKey: ['/api/kubernetes/clusters', selectedCluster, 'resources'],
    enabled: !!selectedCluster,
  });

  // Mutation for adding a new Kubernetes cluster
  const addClusterMutation = useMutation({
    mutationFn: async (values: z.infer<typeof addClusterSchema>) => {
      const response = await apiRequest('POST', '/api/kubernetes/clusters', values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
      toast({
        title: 'Cluster added',
        description: 'Your Kubernetes cluster has been added successfully.',
      });
      setIsAddingCluster(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add cluster',
        description: error.message || 'An error occurred while adding the cluster.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for removing a Kubernetes cluster
  const removeClusterMutation = useMutation({
    mutationFn: async (clusterId: string) => {
      await apiRequest('DELETE', `/api/kubernetes/clusters/${clusterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
      if (selectedCluster) {
        setSelectedCluster(null);
      }
      toast({
        title: 'Cluster removed',
        description: 'The Kubernetes cluster has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove cluster',
        description: error.message || 'An error occurred while removing the cluster.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof addClusterSchema>) => {
    addClusterMutation.mutate(values);
  };

  // Get resource icon based on kind
  const getResourceIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case 'pod':
        return <Box className="h-4 w-4" />;
      case 'deployment':
        return <Shield className="h-4 w-4" />;
      case 'service':
        return <Server className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'available':
      case 'ready':
      case 'active':
        return 'bg-green-500';
      case 'pending':
      case 'contentsourcing':
        return 'bg-yellow-500';
      case 'failed':
      case 'error':
      case 'crashloopbackoff':
      case 'unavailable':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Render cluster list
  const renderClusterList = () => {
    if (clustersError) {
      return (
        <div className="text-red-500 p-4">
          Error loading clusters: {(clustersError as Error).message}
        </div>
      );
    }

    if (clustersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading clusters...</span>
        </div>
      );
    }

    if (clusters.length === 0) {
      return (
        <div className="text-center py-8">
          <Server className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No clusters found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a Kubernetes cluster to start monitoring your infrastructure.
          </p>
          <Button 
            onClick={() => setIsAddingCluster(true)} 
            className="mt-4"
          >
            Add Cluster
          </Button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Clusters</h3>
          <Button 
            onClick={() => setIsAddingCluster(true)} 
            variant="outline"
            size="sm"
          >
            Add Cluster
          </Button>
        </div>
        <div className="space-y-2">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className={`
                p-4 rounded-md border cursor-pointer flex justify-between items-center
                ${selectedCluster === cluster.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
              `}
              onClick={() => setSelectedCluster(cluster.id)}
            >
              <div className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <div className="font-medium">{cluster.name}</div>
                  {cluster.context && (
                    <div className="text-sm text-muted-foreground">
                      Context: {cluster.context}
                    </div>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to remove the cluster "${cluster.name}"?`)) {
                        removeClusterMutation.mutate(cluster.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Cluster
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render resource list
  const renderResourceList = () => {
    if (!selectedCluster) {
      return (
        <div className="text-center py-8">
          <Box className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No cluster selected</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a cluster to view its resources.
          </p>
        </div>
      );
    }

    if (resourcesError) {
      return (
        <div className="text-red-500 p-4">
          Error loading resources: {(resourcesError as Error).message}
        </div>
      );
    }

    if (resourcesLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading resources...</span>
        </div>
      );
    }

    if (resources.length === 0) {
      return (
        <div className="text-center py-8">
          <Box className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No resources found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No resources were found in the selected cluster.
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters', selectedCluster, 'resources'] })}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Resources</h3>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters', selectedCluster, 'resources'] })}
            variant="outline"
            size="sm"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => {
                // Calculate age
                const creationDate = new Date(resource.creationTimestamp);
                const now = new Date();
                const diffInSeconds = Math.floor((now.getTime() - creationDate.getTime()) / 1000);
                
                let age = '';
                if (diffInSeconds < 60) {
                  age = `${diffInSeconds}s`;
                } else if (diffInSeconds < 3600) {
                  age = `${Math.floor(diffInSeconds / 60)}m`;
                } else if (diffInSeconds < 86400) {
                  age = `${Math.floor(diffInSeconds / 3600)}h`;
                } else {
                  age = `${Math.floor(diffInSeconds / 86400)}d`;
                }

                return (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getResourceIcon(resource.kind)}
                        <span className="ml-2">{resource.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{resource.kind}</TableCell>
                    <TableCell>{resource.namespace}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(resource.status)}
                      >
                        {resource.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{age}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Render add cluster form
  const renderAddClusterForm = () => {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Add Kubernetes Cluster</CardTitle>
            <CardDescription>
              Connect a Kubernetes cluster to monitor its resources, health, and utilization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cluster Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Production Cluster" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your Kubernetes cluster.
                      </FormDescription>
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
                      <FormDescription>
                        The kubeconfig content for accessing your cluster. You can get this by running:
                        <code className="block bg-muted p-2 rounded-md mt-1">
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
                      <FormDescription>
                        The specific context to use within the kubeconfig. Leave empty to use the current context.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingCluster(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={addClusterMutation.isPending}
            >
              {addClusterMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Cluster'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kubernetes Integration</h2>
        <p className="text-muted-foreground">
          Monitor and manage your Kubernetes clusters and resources.
        </p>
      </div>

      {isAddingCluster ? (
        renderAddClusterForm()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {renderClusterList()}
          </div>
          <div className="md:col-span-2">
            {renderResourceList()}
          </div>
        </div>
      )}
    </div>
  );
}