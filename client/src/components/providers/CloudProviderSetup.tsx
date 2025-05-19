import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CloudProvider } from '@shared/cloud-providers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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

// AWS Form Schema
const awsFormSchema = z.object({
  accessKeyId: z.string().min(10, "Access key ID is required"),
  secretAccessKey: z.string().min(10, "Secret access key is required"),
  region: z.string().optional(),
  name: z.string().optional()
});

// GCP Form Schema
const gcpFormSchema = z.object({
  serviceAccountKey: z.string().min(100, "Service account key JSON is required"),
  projectId: z.string().optional(),
  name: z.string().optional()
});

// Azure Form Schema
const azureFormSchema = z.object({
  clientId: z.string().min(10, "Client ID is required"),
  clientSecret: z.string().min(10, "Client secret is required"),
  tenantId: z.string().min(10, "Tenant ID is required"),
  subscriptionId: z.string().min(10, "Subscription ID is required"),
  name: z.string().optional()
});

// Provider item interface
interface CloudProviderItem {
  id: CloudProvider;
  name: string;
  isConnected: boolean;
  lastSynced?: string;
}

export function CloudProviderSetup() {
  const [activeTab, setActiveTab] = useState<string>('aws');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connected providers
  const { 
    data: providers = [], 
    isLoading: isLoadingProviders, 
    error: providersError 
  } = useQuery<CloudProviderItem[]>({
    queryKey: ['/api/cloud-providers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/cloud-providers');
      return await res.json();
    }
  });

  // Form handlers for each provider
  const awsForm = useForm<z.infer<typeof awsFormSchema>>({
    resolver: zodResolver(awsFormSchema),
    defaultValues: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      name: 'AWS Account'
    }
  });

  const gcpForm = useForm<z.infer<typeof gcpFormSchema>>({
    resolver: zodResolver(gcpFormSchema),
    defaultValues: {
      serviceAccountKey: '',
      projectId: '',
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
      name: 'Azure Account'
    }
  });

  // AWS connection mutation
  const awsConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof awsFormSchema>) => {
      const res = await apiRequest('POST', '/api/cloud-providers/aws', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "AWS connected successfully",
        description: "Your AWS account has been connected and resources are being synced.",
        variant: "default",
      });
      awsForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect AWS account",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  // GCP connection mutation
  const gcpConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof gcpFormSchema>) => {
      const res = await apiRequest('POST', '/api/cloud-providers/gcp', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "GCP connected successfully",
        description: "Your Google Cloud account has been connected and resources are being synced.",
        variant: "default",
      });
      gcpForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect GCP account",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  // Azure connection mutation
  const azureConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof azureFormSchema>) => {
      const res = await apiRequest('POST', '/api/cloud-providers/azure', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Azure connected successfully",
        description: "Your Microsoft Azure account has been connected and resources are being synced.",
        variant: "default",
      });
      azureForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect Azure account",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  });

  // Remove provider mutation
  const removeProviderMutation = useMutation({
    mutationFn: async (provider: CloudProvider) => {
      const res = await apiRequest('DELETE', `/api/cloud-providers/${provider}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Provider removed",
        description: "Cloud provider has been disconnected successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove provider",
        description: error.message || "An error occurred while removing the provider.",
        variant: "destructive",
      });
    }
  });

  const onSubmitAWS = (data: z.infer<typeof awsFormSchema>) => {
    awsConnectionMutation.mutate(data);
  };

  const onSubmitGCP = (data: z.infer<typeof gcpFormSchema>) => {
    gcpConnectionMutation.mutate(data);
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

  // Find if providers already connected
  const isAwsConnected = providers.some(p => p.id === CloudProvider.AWS);
  const isGcpConnected = providers.some(p => p.id === CloudProvider.GCP);
  const isAzureConnected = providers.some(p => p.id === CloudProvider.AZURE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cloud Provider Integration</h2>
          <p className="text-muted-foreground">
            Connect your cloud accounts to monitor resources, costs, and security
          </p>
        </div>
      </div>

      {/* Connected providers */}
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
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex justify-between items-center">
                  {getProviderIcon(provider.id)}
                  <div className="flex items-center">
                    {provider.isConnected ? (
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
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <CardDescription>
                  {provider.lastSynced ? (
                    <>Last synced: {new Date(provider.lastSynced).toLocaleString()}</>
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
                  onClick={() => handleRemoveProvider(provider.id)}
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
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cloud-providers'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Connect new providers form */}
      <Card>
        <CardHeader>
          <CardTitle>Connect a Cloud Provider</CardTitle>
          <CardDescription>
            Add your cloud provider API credentials to start monitoring your infrastructure
          </CardDescription>
        </CardHeader>
        <div className="px-6 mb-4">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Security Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your credentials are securely encrypted before storage. For maximum security, we recommend using dedicated IAM users with read-only permissions for CloudGuard.
            </AlertDescription>
          </Alert>
        </div>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="aws" disabled={isAwsConnected}>
                <div className="flex items-center">
                  <SiAmazon className="h-4 w-4 mr-2 text-orange-500" />
                  AWS
                </div>
              </TabsTrigger>
              <TabsTrigger value="gcp" disabled={isGcpConnected}>
                <div className="flex items-center">
                  <SiGooglecloud className="h-4 w-4 mr-2 text-blue-500" />
                  GCP
                </div>
              </TabsTrigger>
              <TabsTrigger value="azure" disabled={isAzureConnected}>
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

            {/* AWS Form */}
            <TabsContent value="aws">
              {isAwsConnected ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>AWS Already Connected</AlertTitle>
                  <AlertDescription>
                    You have already connected an AWS account. If you need to change credentials, please disconnect the existing account first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...awsForm}>
                  <form onSubmit={awsForm.handleSubmit(onSubmitAWS)} className="space-y-4">
                    <FormField
                      control={awsForm.control}
                      name="accessKeyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Key ID</FormLabel>
                          <FormControl>
                            <Input placeholder="AWS Access Key ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your AWS IAM Access Key ID. Your IAM user needs read-only permissions for EC2, S3, RDS, IAM, and Cost Explorer services.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={awsForm.control}
                      name="secretAccessKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secret Access Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="AWS Secret Access Key" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your AWS IAM Secret Access Key. We recommend creating a dedicated IAM user with read-only access for CloudGuard.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={awsForm.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <FormControl>
                            <Input placeholder="us-east-1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your primary AWS region (e.g., us-east-1)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={awsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My AWS Account" {...field} />
                          </FormControl>
                          <FormDescription>
                            Give this AWS account a friendly name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Button 
                        type="submit" 
                        className="flex items-center w-full"
                        disabled={awsConnectionMutation.isPending}
                      >
                        {awsConnectionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CloudCog className="h-4 w-4 mr-2" />
                        )}
                        {awsConnectionMutation.isPending ? 'Validating Credentials...' : 'Connect AWS Account'}
                      </Button>
                      {awsConnectionMutation.isError && (
                        <div className="text-sm text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>Connection failed. Please check your credentials and permissions.</span>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              )}
            </TabsContent>

            {/* GCP Form */}
            <TabsContent value="gcp">
              {isGcpConnected ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>GCP Already Connected</AlertTitle>
                  <AlertDescription>
                    You have already connected a Google Cloud Platform account. If you need to change credentials, please disconnect the existing account first.
                  </AlertDescription>
                </Alert>
              ) : (
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
                        {gcpConnectionMutation.isPending ? 'Validating Credentials...' : 'Connect GCP Account'}
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
              )}
            </TabsContent>

            {/* Azure Form */}
            <TabsContent value="azure">
              {isAzureConnected ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>Azure Already Connected</AlertTitle>
                  <AlertDescription>
                    You have already connected a Microsoft Azure account. If you need to change credentials, please disconnect the existing account first.
                  </AlertDescription>
                </Alert>
              ) : (
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
                        {azureConnectionMutation.isPending ? 'Validating Credentials...' : 'Connect Azure Account'}
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
                            // Handle file upload
                            const file = e.target.files?.[0];
                            if (file) {
                              // File processing would go here
                              console.log('File selected:', file.name);
                            }
                          }}
                        />
                        <label htmlFor="kubeconfig-file" className="cursor-pointer w-full text-center">
                          <Database className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            YAML or JSON (max. 100KB)
                          </p>
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">
                          Cluster Name (Optional)
                        </label>
                        <Input 
                          placeholder="e.g., Production Cluster" 
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          If not provided, we'll use the cluster name from the kubeconfig.
                        </p>
                      </div>
                      
                      <Button className="w-full mt-4">
                        Connect Kubernetes Cluster
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
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">
                          Cluster Name (Optional)
                        </label>
                        <Input 
                          placeholder="e.g., Production Cluster" 
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          If not provided, we'll use the cluster name from the kubeconfig.
                        </p>
                      </div>
                      
                      <Button className="w-full mt-4">
                        Connect Kubernetes Cluster
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Connected Kubernetes clusters list */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Connected Kubernetes Clusters</h4>
                  
                  <div className="border rounded-md overflow-hidden">
                    {/* Example cluster - in a real implementation this would be dynamic */}
                    <div className="p-4 border-b last:border-0 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Server className="h-8 w-8 text-blue-400" />
                        <div>
                          <div className="font-medium">Development Cluster</div>
                          <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                              v1.25.8
                            </span>
                            <span>3 nodes</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Credential permissions info */}
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
                AWS IAM Permissions
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>EC2:DescribeInstances</li>
                <li>EC2:DescribeVolumes</li>
                <li>S3:ListBuckets</li>
                <li>S3:GetBucketTagging</li>
                <li>RDS:DescribeDBInstances</li>
                <li>IAM:ListAccessKeys</li>
                <li>CostExplorer:GetCostAndUsage</li>
                <li><em>Read-only policy recommended</em></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium flex items-center mb-2">
                <SiGooglecloud className="h-4 w-4 mr-2 text-blue-500" />
                GCP IAM Roles
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Compute Viewer</li>
                <li>Storage Object Viewer</li>
                <li>Cloud SQL Viewer</li>
                <li>Monitoring Viewer</li>
                <li>Security Center Viewer</li>
                <li>Billing Account Viewer</li>
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
                <li>Monitor Reader</li>
                <li>Storage Blob Data Reader</li>
                <li>Key Vault Reader</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}