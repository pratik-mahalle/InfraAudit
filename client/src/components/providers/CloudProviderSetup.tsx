import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CloudProvider } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  ServerCog,
  CloudCog,
  Database,
  Cloud,
  Server
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { SiAmazon, SiGooglecloud } from 'react-icons/si';

const gcpServiceAccountKeySchema = z.string()
  .min(100, "Service account key JSON is required")
  .superRefine((value, context) => {
    try {
      const key = JSON.parse(value) as Record<string, unknown>;
      if (
        key.type !== 'service_account'
        || typeof key.project_id !== 'string'
        || typeof key.client_email !== 'string'
        || typeof key.private_key !== 'string'
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use a complete GCP service account key JSON file",
        });
      }
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Service account key must be valid JSON",
      });
    }
  });

const awsRoleFormSchema = z.object({
  roleArn: z.string().trim().regex(
    /^arn:aws(?:-[a-z0-9]+)*:iam::[0-9]{12}:role\/[A-Za-z0-9+=,.@_-]+(?:\/[A-Za-z0-9+=,.@_-]+)*$/,
    "Enter the exact IAM RoleArn from the CloudFormation stack output",
  ),
  region: z.string().trim().regex(
    /^[a-z]{2}(?:-[a-z0-9]+)+-[0-9]+$/,
    "Enter a valid AWS region such as us-east-1",
  ),
});

// GCP Form Schema
const gcpFormSchema = z.object({
  serviceAccountKey: gcpServiceAccountKeySchema,
  projectId: z.string().trim().refine(
    (value) => !value || /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value),
    "Enter a valid GCP project ID",
  ).optional(),
  billingDataset: z.string().trim().refine(
    (value) => !value || /^[a-z][a-z0-9-]{4,28}[a-z0-9]\.[A-Za-z0-9_]+\.[A-Za-z0-9_$]+$/.test(value),
    "Use the format project.dataset.table",
  ).optional(),
  name: z.string().optional()
});

// Azure Form Schema
const azureFormSchema = z.object({
  clientId: z.string().min(10, "Client ID is required"),
  clientSecret: z.string().min(10, "Client secret is required"),
  tenantId: z.string().min(10, "Tenant ID is required"),
  subscriptionId: z.string().min(10, "Subscription ID is required"),
  location: z.string().trim().optional(),
  name: z.string().optional()
});

function projectIDFromServiceAccount(serviceAccountKey: string): string {
  const key = JSON.parse(serviceAccountKey) as Record<string, unknown>;
  return typeof key.project_id === 'string' ? key.project_id.trim() : '';
}

// Provider item interface — matches Go DTO ProviderDTO after camelCase conversion
interface CloudProviderItem {
  provider: string;       // "aws" | "gcp" | "azure" (lowercase from backend)
  isConnected: boolean;
  lastSynced?: string;
  status?: 'connected' | 'disconnected' | 'partial' | 'error';
  message?: string;
}

// Kubernetes cluster type — matches KubernetesIntegration component
interface K8sCluster {
  id: number;
  name: string;
  context?: string;
  hasKubeconfig: boolean;
  status?: 'connected' | 'disconnected' | 'error';
  nodeCount?: number;
  nodes?: number;
  version?: string;
}

export function CloudProviderSetup({
  showHeader = true,
  showConnectedProviders = true,
  initialTab = 'aws',
  allowConnectedProviderUpdate = false,
}: {
  showHeader?: boolean;
  showConnectedProviders?: boolean;
  initialTab?: string;
  allowConnectedProviderUpdate?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Kubernetes tab state
  const [k8sPasteContent, setK8sPasteContent] = useState('');
  const [k8sUploadContent, setK8sUploadContent] = useState('');
  const [k8sUploadFileName, setK8sUploadFileName] = useState('');
  const [k8sUploadClusterName, setK8sUploadClusterName] = useState('');
  const [k8sPasteClusterName, setK8sPasteClusterName] = useState('');

  // Fetch connected providers — use default queryFn which unwraps Go { success, data } envelope
  const { 
    data: providers = [], 
    isLoading: isLoadingProviders, 
    error: providersError 
  } = useQuery<CloudProviderItem[]>({
    queryKey: ['providers'],
    queryFn: () => api.providers.list(),
  });

  // Form handlers for provider connection inputs.
  const awsRoleForm = useForm<z.infer<typeof awsRoleFormSchema>>({
    resolver: zodResolver(awsRoleFormSchema),
    defaultValues: {
      roleArn: '',
      region: 'us-east-1',
    },
  });

  const gcpForm = useForm<z.infer<typeof gcpFormSchema>>({
    resolver: zodResolver(gcpFormSchema),
    defaultValues: {
      serviceAccountKey: '',
      projectId: '',
      billingDataset: '',
      name: 'GCP Account'
    }
  });

  const azureForm = useForm<z.infer<typeof azureFormSchema>>({
    resolver: zodResolver(azureFormSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      tenantId: '',
      subscriptionId: '',
      location: '',
      name: 'Azure Account'
    }
  });

  const awsRoleTemplateMutation = useMutation({
    mutationFn: () => api.providers.downloadAWSRoleTemplate(),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast({
        title: 'AWS role template downloaded',
        description: 'Review and deploy it in the AWS account you want InfraAudit to monitor.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not download AWS role template',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const awsRoleConnectionMutation = useMutation({
    mutationFn: (data: z.infer<typeof awsRoleFormSchema>) => api.providers.connect('aws', {
      roleArn: data.roleArn.trim(),
      region: data.region.trim(),
    }),
    onSuccess: () => {
      toast({
        title: isAwsConnected ? 'AWS role updated' : 'AWS connected successfully',
        description: 'InfraAudit validated a short-lived STS session and started the first inventory sync.',
      });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not activate AWS role',
        description: error.message || 'Confirm the stack RoleArn and trust policy, then try again.',
        variant: 'destructive',
      });
    },
  });

  // GCP connection mutation — transform camelCase form fields to Go backend snake_case DTO
  const gcpConnectionMutation = useMutation({
    mutationFn: (data: z.infer<typeof gcpFormSchema>) => api.providers.connect('gcp', {
      projectId: data.projectId || projectIDFromServiceAccount(data.serviceAccountKey),
      credentials: data.serviceAccountKey,
      billingDataset: data.billingDataset || undefined,
    }),
    onSuccess: () => {
      toast({
        title: "GCP connected successfully",
        description: "Your Google Cloud account has been connected and resources are being synced.",
        variant: "default",
      });
      gcpForm.reset();
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect GCP account",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  // Azure connection mutation — transform camelCase form fields to Go backend snake_case DTO
  const azureConnectionMutation = useMutation({
    mutationFn: (data: z.infer<typeof azureFormSchema>) => api.providers.connect('azure', {
      tenantId: data.tenantId,
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      subscriptionId: data.subscriptionId,
      location: data.location || undefined,
    }),
    onSuccess: () => {
      toast({
        title: "Azure connected successfully",
        description: "Your Microsoft Azure account has been connected and resources are being synced.",
        variant: "default",
      });
      azureForm.reset();
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect Azure account",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  // Remove provider mutation — backend expects lowercase provider name in URL
  const removeProviderMutation = useMutation({
    mutationFn: async (provider: CloudProvider) => {
      const res = await apiRequest('DELETE', `/api/v1/providers/${provider.toLowerCase()}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Provider removed",
        description: "Cloud provider has been disconnected successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove provider",
        description: error.message || "An error occurred while removing the provider.",
        variant: "destructive",
      });
    }
  });

  const syncProviderMutation = useMutation({
    mutationFn: (provider: string) => api.providers.sync(provider.toLowerCase()),
    onSuccess: () => {
      toast({
        title: 'Provider sync complete',
        description: 'The latest cloud inventory is now available for drift scanning.',
      });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Provider sync failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch Kubernetes clusters
  const {
    data: k8sClusters = [],
    isLoading: isLoadingK8sClusters,
    error: k8sClustersError,
  } = useQuery<K8sCluster[]>({
    queryKey: ['/api/kubernetes/clusters'],
    select: (data) => (Array.isArray(data) ? data : []),
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('404')) return false;
      return failureCount < 3;
    },
  });

  // Register a new K8s cluster
  const registerK8sClusterMutation = useMutation({
    mutationFn: async (body: { name: string; kubeconfig: string; context?: string }) => {
      const res = await apiRequest('POST', '/api/kubernetes/clusters', body);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Kubernetes cluster connected',
        description: 'Your cluster has been registered and is being synced.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
      // Reset form state
      setK8sUploadContent('');
      setK8sUploadFileName('');
      setK8sUploadClusterName('');
      setK8sPasteContent('');
      setK8sPasteClusterName('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to connect Kubernetes cluster',
        description: error.message || 'Please check your kubeconfig and try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete/disconnect a K8s cluster
  const removeK8sClusterMutation = useMutation({
    mutationFn: async (clusterId: number) => {
      await apiRequest('DELETE', `/api/kubernetes/clusters/${clusterId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Kubernetes cluster disconnected',
        description: 'The cluster has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kubernetes/clusters'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to disconnect cluster',
        description: error.message || 'An error occurred while removing the cluster.',
        variant: 'destructive',
      });
    },
  });

  const handleConnectK8sUpload = () => {
    if (!k8sUploadContent) {
      toast({ title: 'No kubeconfig file', description: 'Please upload a kubeconfig file first.', variant: 'destructive' });
      return;
    }
    registerK8sClusterMutation.mutate({
      name: k8sUploadClusterName || k8sUploadFileName || 'Kubernetes Cluster',
      kubeconfig: k8sUploadContent,
    });
  };

  const handleConnectK8sPaste = () => {
    if (!k8sPasteContent || k8sPasteContent.length < 50) {
      toast({ title: 'Invalid kubeconfig', description: 'Please paste a valid kubeconfig content.', variant: 'destructive' });
      return;
    }
    registerK8sClusterMutation.mutate({
      name: k8sPasteClusterName || 'Kubernetes Cluster',
      kubeconfig: k8sPasteContent,
    });
  };

  const handleDisconnectK8s = (cluster: K8sCluster) => {
    if (confirm(`Are you sure you want to disconnect "${cluster.name}"?`)) {
      removeK8sClusterMutation.mutate(cluster.id);
    }
  };

  const onSubmitGCP = (data: z.infer<typeof gcpFormSchema>) => {
    gcpConnectionMutation.mutate(data);
  };

  const onSubmitAWSRole = (data: z.infer<typeof awsRoleFormSchema>) => {
    awsRoleConnectionMutation.mutate(data);
  };

  const onSubmitAzure = (data: z.infer<typeof azureFormSchema>) => {
    azureConnectionMutation.mutate(data);
  };

  const handleRemoveProvider = (provider: CloudProvider) => {
    if (confirm(`Are you sure you want to disconnect ${getProviderName(provider)}?`)) {
      removeProviderMutation.mutate(provider);
    }
  };

  const getProviderName = (provider: CloudProvider): string => {
    switch (provider) {
      case CloudProvider.AWS:
        return 'Amazon Web Services';
      case CloudProvider.GCP:
        return 'Google Cloud Platform';
      case CloudProvider.AZURE:
        return 'Microsoft Azure';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: CloudProvider) => {
    switch (provider) {
      case CloudProvider.AWS:
        return <SiAmazon className="h-6 w-6 text-orange-500" />;
      case CloudProvider.GCP:
        return <SiGooglecloud className="h-6 w-6 text-blue-500" />;
      case CloudProvider.AZURE:
        return <Cloud className="h-6 w-6 text-blue-700" />;
      default:
        return <CloudCog className="h-6 w-6" />;
    }
  };

  // Find if providers already connected (backend uses lowercase: "aws", "gcp", "azure")
  const isAwsConnected = providers.some(p => p.provider === 'aws' && p.isConnected);
  const isGcpConnected = providers.some(p => p.provider === 'gcp' && p.isConnected);
  const isAzureConnected = providers.some(p => p.provider === 'azure' && p.isConnected);
  const gcpSubmitLabel = isGcpConnected && allowConnectedProviderUpdate ? 'Update GCP Account' : 'Connect GCP Account';
  const azureSubmitLabel = isAzureConnected && allowConnectedProviderUpdate ? 'Update Azure Account' : 'Connect Azure Account';

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Cloud Provider Integration</h2>
            <p className="text-muted-foreground">
              Connect your cloud accounts to monitor resources, costs, and security
            </p>
          </div>
        </div>
      )}

      {showConnectedProviders && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {isLoadingProviders ? (
            <Card className="col-span-full flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Loading connected providers...</p>
            </Card>
          ) : providersError ? (
            <Card className="col-span-full bg-destructive/10 p-6">
              <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
              <h3 className="font-medium">Error loading providers</h3>
              <p className="text-sm text-muted-foreground">
                {(providersError as Error).message || "Failed to load connected cloud providers"}
              </p>
            </Card>
          ) : providers.length === 0 ? (
            <Card className="col-span-full p-6">
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <ServerCog className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium text-center">No cloud providers connected</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Connect your cloud providers below to start monitoring your infrastructure
                </p>
              </div>
            </Card>
          ) : (
            providers.map((prov) => (
              <Card key={prov.provider} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <div className="flex justify-between items-center">
                    {getProviderIcon(prov.provider.toUpperCase() as CloudProvider)}
                    <div className="flex items-center">
                      {prov.status === 'partial' ? (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Partial
                        </span>
                      ) : prov.isConnected ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{getProviderName(prov.provider.toUpperCase() as CloudProvider)}</CardTitle>
                  <CardDescription>
                    {prov.message ? (
                      <>{prov.message}</>
                    ) : prov.lastSynced ? (
                      <>Last synced: {new Date(prov.lastSynced).toLocaleString()}</>
                    ) : (
                      <>Not yet synced</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleRemoveProvider(prov.provider.toUpperCase() as CloudProvider)}
                    disabled={removeProviderMutation.isPending}
                  >
                    {removeProviderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Disconnect
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center"
                    onClick={() => syncProviderMutation.mutate(prov.provider)}
                    disabled={syncProviderMutation.isPending}
                  >
                    {syncProviderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Sync now
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Connect new providers form */}
      <Card>
        <CardHeader>
          <CardTitle>Set Up a Cloud Provider</CardTitle>
          <CardDescription>
            Use a least-privilege cloud identity to start monitoring your infrastructure
          </CardDescription>
        </CardHeader>
        <div className="px-6 mb-4">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Security Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              AWS setup uses a cross-account role and never asks for access keys. Secrets required by other providers are encrypted before storage.
            </AlertDescription>
          </Alert>
        </div>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="aws">
                <div className="flex items-center">
                  <SiAmazon className="h-4 w-4 mr-2 text-orange-500" />
                  AWS
                </div>
              </TabsTrigger>
              <TabsTrigger value="gcp" disabled={isGcpConnected && !allowConnectedProviderUpdate}>
                <div className="flex items-center">
                  <SiGooglecloud className="h-4 w-4 mr-2 text-blue-500" />
                  GCP
                </div>
              </TabsTrigger>
              <TabsTrigger value="azure" disabled={isAzureConnected && !allowConnectedProviderUpdate}>
                <div className="flex items-center">
                  <Cloud className="h-4 w-4 mr-2 text-blue-700" />
                  Azure
                </div>
              </TabsTrigger>
              <TabsTrigger value="kubernetes">
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2 text-blue-400" />
                  Kubernetes
                </div>
              </TabsTrigger>
            </TabsList>

            {/* AWS role onboarding */}
            <TabsContent value="aws" className="space-y-4">
              {isAwsConnected && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>AWS connection already exists</AlertTitle>
                  <AlertDescription>
                    Submit a newly deployed RoleArn below to validate and replace the current role connection.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border bg-muted/30 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      No long-lived AWS keys
                    </div>
                    <h3 className="text-lg font-semibold">Create the InfraAudit read-only role</h3>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      The protected template is unique to your organization. It trusts only the exact InfraAudit backend and worker roles and requires your organization-specific external ID for every future session.
                    </p>
                  </div>
                  <a
                    href="https://github.com/pratik-mahalle/infra-backend/blob/main/docs/aws-inventory-permissions.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Review permission catalog
                  </a>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['1', 'Download and review', 'An owner or administrator downloads the organization-bound JSON template.'],
                  ['2', 'Deploy in AWS', 'An AWS operator creates the CloudFormation stack and chooses the optional read policies.'],
                  ['3', 'Activate the RoleArn', 'Paste the exact stack output below. InfraAudit validates it with a short-lived STS session.'],
                ].map(([step, title, description]) => (
                  <div key={step} className="rounded-md border p-4">
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {step}
                    </div>
                    <h4 className="font-medium">{title}</h4>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Template permissions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Required read-only inventory and local security checks</li>
                  <li>Optional Cost Explorer read access, enabled by default</li>
                  <li>Optional Security Hub and Inspector read access, disabled by default</li>
                  <li>No remediation actions, IAM users, or access keys</li>
                </ul>
              </div>

              <Button
                type="button"
                className="flex w-full items-center"
                disabled={awsRoleTemplateMutation.isPending}
                onClick={() => awsRoleTemplateMutation.mutate()}
              >
                {awsRoleTemplateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {awsRoleTemplateMutation.isPending ? 'Preparing protected template...' : 'Download CloudFormation role template'}
              </Button>

              <Form {...awsRoleForm}>
                <form onSubmit={awsRoleForm.handleSubmit(onSubmitAWSRole)} className="space-y-4 rounded-md border p-4">
                  <div>
                    <h4 className="font-medium">Activate the deployed role</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      InfraAudit exchanges its workload identity for expiring STS credentials. The external ID stays server-managed.
                    </p>
                  </div>
                  <FormField
                    control={awsRoleForm.control}
                    name="roleArn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CloudFormation RoleArn</FormLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="arn:aws:iam::123456789012:role/InfraAuditReadOnlyRole" {...field} />
                        </FormControl>
                        <FormDescription>Paste the exact RoleArn stack output; wildcards, users, and account-root ARNs are rejected.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={awsRoleForm.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home region</FormLabel>
                        <FormControl><Input placeholder="us-east-1" {...field} /></FormControl>
                        <FormDescription>Used as the initial region; inventory discovery can scan additional enabled regions.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={awsRoleConnectionMutation.isPending}>
                    {awsRoleConnectionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {awsRoleConnectionMutation.isPending ? 'Validating short-lived session...' : (isAwsConnected ? 'Validate and update AWS role' : 'Validate and connect AWS role')}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* GCP Form */}
            <TabsContent value="gcp">
              {isGcpConnected && !allowConnectedProviderUpdate ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>GCP Already Connected</AlertTitle>
                  <AlertDescription>
                    You have already connected a Google Cloud Platform account. If you need to change credentials, please disconnect the existing account first.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <a
                      href="https://github.com/pratik-mahalle/infra-backend/blob/main/docs/gcp-inventory-permissions.md"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Download size={16} />
                      View GCP IAM Setup
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      Create a dedicated service account and grant only the documented viewer roles.
                    </p>
                  </div>
                  <Form {...gcpForm}>
                    <form onSubmit={gcpForm.handleSubmit(onSubmitGCP)} className="space-y-4">
                    <FormField
                      control={gcpForm.control}
                      name="serviceAccountKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Account Key (JSON)</FormLabel>
                          <FormControl>
                            <textarea
                              placeholder='Paste your GCP service account key JSON here'
                              className="min-h-[120px] font-mono text-xs w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              rows={8}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Paste your GCP service account key JSON content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gcpForm.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="my-gcp-project-id" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your GCP Project ID if not included in the service account key
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gcpForm.control}
                      name="billingDataset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Export Table (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="billing-project.dataset.gcp_billing_export_v1_XXXXXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            Fully qualified BigQuery billing export table used for GCP cost synchronization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gcpForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My GCP Account" {...field} />
                          </FormControl>
                          <FormDescription>
                            Give this GCP account a friendly name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Button 
                        type="submit" 
                        className="flex items-center w-full"
                        disabled={gcpConnectionMutation.isPending}
                      >
                        {gcpConnectionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CloudCog className="h-4 w-4 mr-2" />
                        )}
                        {gcpConnectionMutation.isPending ? 'Validating Credentials...' : gcpSubmitLabel}
                      </Button>
                      {gcpConnectionMutation.isError && (
                        <div className="text-sm text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>Connection failed. Please check your service account key and permissions.</span>
                        </div>
                      )}
                    </div>
                    </form>
                  </Form>
                </>
              )}
            </TabsContent>

            {/* Azure Form */}
            <TabsContent value="azure">
              {isAzureConnected && !allowConnectedProviderUpdate ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>Azure Already Connected</AlertTitle>
                  <AlertDescription>
                    You have already connected a Microsoft Azure account. If you need to change credentials, please disconnect the existing account first.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <a
                      href="https://github.com/pratik-mahalle/infra-backend/blob/main/docs/azure-inventory-permissions.md"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Download size={16} />
                      View Azure RBAC Setup
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      Register a dedicated application and assign read-only roles at subscription scope.
                    </p>
                  </div>
                  <Form {...azureForm}>
                    <form onSubmit={azureForm.handleSubmit(onSubmitAzure)} className="space-y-4">
                    <FormField
                      control={azureForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Azure Client ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your Azure Service Principal Client ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={azureForm.control}
                      name="clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Azure Client Secret" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your Azure Service Principal Client Secret
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={azureForm.control}
                      name="tenantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Azure Tenant ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your Azure Tenant ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={azureForm.control}
                      name="subscriptionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Azure Subscription ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your Azure Subscription ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={azureForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="eastus" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used only when an Azure resource does not report its own location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={azureForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Azure Account" {...field} />
                          </FormControl>
                          <FormDescription>
                            Give this Azure account a friendly name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Button 
                        type="submit" 
                        className="flex items-center w-full"
                        disabled={azureConnectionMutation.isPending}
                      >
                        {azureConnectionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CloudCog className="h-4 w-4 mr-2" />
                        )}
                        {azureConnectionMutation.isPending ? 'Validating Credentials...' : azureSubmitLabel}
                      </Button>
                      {azureConnectionMutation.isError && (
                        <div className="text-sm text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>Connection failed. Please check your service principal credentials and permissions.</span>
                        </div>
                      )}
                    </div>
                    </form>
                  </Form>
                </>
              )}
            </TabsContent>
            {/* Kubernetes Tab Content */}
            <TabsContent value="kubernetes">
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-start space-x-3">
                    <Server className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Kubernetes Cluster Integration</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Integrate your Kubernetes clusters by uploading your kubeconfig file or pasting its contents below.
                        The kubeconfig provides the necessary credentials to access your cluster.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Tabs defaultValue="upload">
                    <TabsList className="w-full">
                      <TabsTrigger value="upload" className="flex-1">Upload Kubeconfig</TabsTrigger>
                      <TabsTrigger value="paste" className="flex-1">Paste Kubeconfig</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-4 space-y-4">
                      <label className="block text-sm font-medium mb-1">
                        Kubeconfig File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          id="kubeconfig-file"
                          className="hidden"
                          accept=".yaml,.yml,.json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 100 * 1024) {
                                toast({ title: 'File too large', description: 'Kubeconfig file must be under 100KB.', variant: 'destructive' });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const content = ev.target?.result as string;
                                setK8sUploadContent(content);
                                setK8sUploadFileName(file.name.replace(/\.(ya?ml|json)$/, ''));
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                        <label htmlFor="kubeconfig-file" className="cursor-pointer w-full text-center">
                          {k8sUploadContent ? (
                            <>
                              <Check className="h-10 w-10 mx-auto text-green-500 mb-2" />
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                {k8sUploadFileName || 'File loaded'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Click to replace
                              </p>
                            </>
                          ) : (
                            <>
                              <Database className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm font-medium">Click to upload or drag and drop</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                YAML or JSON (max. 100KB)
                              </p>
                            </>
                          )}
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">
                          Cluster Name (Optional)
                        </label>
                        <Input
                          placeholder="e.g., Production Cluster"
                          className="w-full"
                          value={k8sUploadClusterName}
                          onChange={(e) => setK8sUploadClusterName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          If not provided, we'll use the cluster name from the kubeconfig.
                        </p>
                      </div>

                      <Button
                        className="w-full mt-4"
                        disabled={!k8sUploadContent || registerK8sClusterMutation.isPending}
                        onClick={handleConnectK8sUpload}
                      >
                        {registerK8sClusterMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Server className="h-4 w-4 mr-2" />
                        )}
                        {registerK8sClusterMutation.isPending ? 'Connecting...' : 'Connect Kubernetes Cluster'}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="paste" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">
                          Kubeconfig Content
                        </label>
                        <textarea
                          className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Paste your kubeconfig content here (YAML or JSON)"
                          value={k8sPasteContent}
                          onChange={(e) => setK8sPasteContent(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">
                          Cluster Name (Optional)
                        </label>
                        <Input
                          placeholder="e.g., Production Cluster"
                          className="w-full"
                          value={k8sPasteClusterName}
                          onChange={(e) => setK8sPasteClusterName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          If not provided, we'll use the cluster name from the kubeconfig.
                        </p>
                      </div>

                      <Button
                        className="w-full mt-4"
                        disabled={!k8sPasteContent || registerK8sClusterMutation.isPending}
                        onClick={handleConnectK8sPaste}
                      >
                        {registerK8sClusterMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Server className="h-4 w-4 mr-2" />
                        )}
                        {registerK8sClusterMutation.isPending ? 'Connecting...' : 'Connect Kubernetes Cluster'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Connected Kubernetes clusters list */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Connected Kubernetes Clusters</h4>

                  {isLoadingK8sClusters ? (
                    <div className="border rounded-md p-6 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading clusters...</span>
                    </div>
                  ) : k8sClustersError ? (
                    <div className="border rounded-md p-4 bg-destructive/10">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          {(k8sClustersError as Error).message || 'Failed to load Kubernetes clusters'}
                        </span>
                      </div>
                    </div>
                  ) : k8sClusters.length === 0 ? (
                    <div className="border rounded-md p-6 text-center">
                      <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No Kubernetes clusters connected yet.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      {k8sClusters.map((cluster) => (
                        <div key={cluster.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <Server className="h-8 w-8 text-blue-400" />
                            <div>
                              <div className="font-medium">{cluster.name}</div>
                              <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                {cluster.version && (
                                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                                    {cluster.version.startsWith('v') ? cluster.version : `v${cluster.version}`}
                                  </span>
                                )}
                                {(cluster.nodes || cluster.nodeCount) != null && (
                                  <span>{cluster.nodes || cluster.nodeCount} nodes</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={removeK8sClusterMutation.isPending}
                              onClick={() => handleDisconnectK8s(cluster)}
                            >
                              {removeK8sClusterMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                

              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cloud identity permissions info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Required Cloud Permissions
          </CardTitle>
          <CardDescription>
            The following permissions are needed for each cloud provider to properly monitor resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium flex items-center mb-2">
                <SiAmazon className="h-4 w-4 mr-2 text-orange-500" />
                AWS read role
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Inventory read policy required</li>
                <li>Cost Explorer read optional</li>
                <li>Security Hub and Inspector reads optional</li>
                <li>Exact role trust plus external ID</li>
                <li>No long-lived access keys</li>
                <li>No remediation permissions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium flex items-center mb-2">
                <SiGooglecloud className="h-4 w-4 mr-2 text-blue-500" />
                GCP IAM Roles
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Compute Viewer</li>
                <li>Storage Bucket Viewer</li>
                <li>Cloud Asset Viewer</li>
                <li>Security Center Findings Viewer</li>
                <li>BigQuery Data Viewer + Job User (for billing export)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium flex items-center mb-2">
                <Cloud className="h-4 w-4 mr-2 text-blue-700" />
                Azure RBAC Roles
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Reader</li>
                <li>Cost Management Reader</li>
                <li>Security Reader</li>
                <li>Monitoring Reader</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
