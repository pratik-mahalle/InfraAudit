import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  CloudIcon, 
  PlusCircle, 
  Check, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  CircleOff, 
  RefreshCw,
  Loader2,
  Info
} from "lucide-react";
import { SiAmazon, SiAmazonwebservices, SiGooglecloud, SiMicrosoftazure } from "react-icons/si";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CloudProvider, AllCloudCredentials } from "@shared/cloud-providers";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const awsFormSchema = z.object({
  accessKeyId: z.string().min(16, "Access Key ID must be at least 16 characters"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().optional(),
});

const gcpFormSchema = z.object({
  serviceAccountKey: z.string().min(1, "Service Account Key is required"),
  projectId: z.string().optional(),
});

const azureFormSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

interface CloudAccountUI {
  id: string;
  name: string;
  provider: CloudProvider;
  isConnected: boolean;
  lastSynced?: string;
  resourceCount?: number;
  icon: React.ReactNode;
  status: "active" | "error" | "disconnected";
}

export function CloudProviderIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("aws");
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  // AWS form
  const awsForm = useForm<z.infer<typeof awsFormSchema>>({
    resolver: zodResolver(awsFormSchema),
    defaultValues: {
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
    },
  });

  // GCP form
  const gcpForm = useForm<z.infer<typeof gcpFormSchema>>({
    resolver: zodResolver(gcpFormSchema),
    defaultValues: {
      serviceAccountKey: "",
      projectId: "",
    },
  });

  // Azure form
  const azureForm = useForm<z.infer<typeof azureFormSchema>>({
    resolver: zodResolver(azureFormSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      tenantId: "",
      subscriptionId: "",
    },
  });

  // Fetch connected cloud accounts
  const { data: cloudProviders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/cloud-providers"],
  });

  // Fetch cloud resources
  const { data: cloudResources } = useQuery<any[]>({
    queryKey: ["/api/cloud-resources"],
    // Only fetch resources if we have connected providers
    enabled: !!cloudProviders && cloudProviders.length > 0,
  });

  // Map cloud providers to UI format
  const connectedAccounts: CloudAccountUI[] = React.useMemo(() => {
    if (!cloudProviders) return [];
    
    return cloudProviders.map(provider => {
      // Count resources for this provider if available
      const providerResources = cloudResources?.filter(
        resource => resource.provider === provider.id
      ) || [];
      
      let icon: React.ReactNode;
      switch (provider.id) {
        case CloudProvider.AWS:
          icon = <SiAmazonwebservices className="h-6 w-6 text-orange-500" />;
          break;
        case CloudProvider.GCP:
          icon = <SiGooglecloud className="h-6 w-6 text-blue-500" />;
          break;
        case CloudProvider.AZURE:
          icon = <CloudIcon className="h-6 w-6 text-blue-600" />;
          break;
        default:
          icon = <CloudIcon className="h-6 w-6 text-slate-600" />;
      }
      
      return {
        id: provider.id,
        name: provider.name,
        provider: provider.id as CloudProvider,
        isConnected: provider.isConnected,
        lastSynced: provider.lastSynced || new Date().toISOString(),
        resourceCount: providerResources.length,
        icon,
        status: provider.isConnected ? "active" : "error"
      };
    });
  }, [cloudProviders, cloudResources]);

  // Add cloud provider mutation
  const addProviderMutation = useMutation({
    mutationFn: async (credentials: AllCloudCredentials) => {
      console.log("Adding cloud provider:", credentials);
      
      let endpoint = '';
      switch (credentials.provider) {
        case CloudProvider.AWS:
          endpoint = '/api/cloud-providers/aws';
          break;
        case CloudProvider.GCP:
          endpoint = '/api/cloud-providers/gcp';
          break;
        case CloudProvider.AZURE:
          endpoint = '/api/cloud-providers/azure';
          break;
        default:
          throw new Error('Unsupported cloud provider');
      }
      
      const response = await apiRequest('POST', endpoint, credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect provider');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-providers"] });
      setIsAddingProvider(false);
      toast({
        title: "Cloud provider connected",
        description: "Your cloud provider has been successfully connected.",
      });
      
      // Reset forms
      awsForm.reset();
      gcpForm.reset();
      azureForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to cloud provider. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Sync cloud provider mutation
  const syncProviderMutation = useMutation({
    mutationFn: async (accountId: string) => {
      // In a real app, this would call the API
      console.log("Syncing cloud provider:", accountId);
      // Mock response
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-providers"] });
      toast({
        title: "Sync successful",
        description: "Your cloud provider resources have been synchronized.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync cloud provider resources. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Disconnect cloud provider mutation
  const disconnectProviderMutation = useMutation({
    mutationFn: async (accountId: string) => {
      // In a real app, this would call the API
      console.log("Disconnecting cloud provider:", accountId);
      // Mock response
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-providers"] });
      toast({
        title: "Provider disconnected",
        description: "Your cloud provider has been disconnected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect cloud provider. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle AWS form submission
  const onAwsSubmit = (data: z.infer<typeof awsFormSchema>) => {
    addProviderMutation.mutate({
      provider: CloudProvider.AWS,
      accessKeyId: data.accessKeyId,
      secretAccessKey: data.secretAccessKey,
      region: data.region,
    });
  };

  // Handle GCP form submission
  const onGcpSubmit = (data: z.infer<typeof gcpFormSchema>) => {
    addProviderMutation.mutate({
      provider: CloudProvider.GCP,
      serviceAccountKey: data.serviceAccountKey,
      projectId: data.projectId,
    });
  };

  // Handle Azure form submission
  const onAzureSubmit = (data: z.infer<typeof azureFormSchema>) => {
    addProviderMutation.mutate({
      provider: CloudProvider.AZURE,
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      tenantId: data.tenantId,
      subscriptionId: data.subscriptionId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Cloud Providers</h2>
          <p className="text-muted-foreground">Connect and manage your cloud providers</p>
        </div>
        
        <Button 
          onClick={() => setIsAddingProvider(!isAddingProvider)} 
          variant={isAddingProvider ? "outline" : "default"}
          className="gap-2"
        >
          {isAddingProvider ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Add Provider
            </>
          )}
        </Button>
      </div>

      {/* Add Provider Forms */}
      {isAddingProvider && (
        <Card className="border-border/60 mb-6 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle>Connect a Cloud Provider</CardTitle>
            <CardDescription>
              Add your cloud provider credentials to enable monitoring and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aws" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aws" className="flex gap-2 items-center">
                  <SiAmazonwebservices className="h-4 w-4" />
                  AWS
                </TabsTrigger>
                <TabsTrigger value="gcp" className="flex gap-2 items-center">
                  <SiGooglecloud className="h-4 w-4" />
                  GCP
                </TabsTrigger>
                <TabsTrigger value="azure" className="flex gap-2 items-center">
                  <CloudIcon className="h-4 w-4" />
                  Azure
                </TabsTrigger>
              </TabsList>

              {/* AWS Form */}
              <TabsContent value="aws" className="mt-4">
                <Form {...awsForm}>
                  <form onSubmit={awsForm.handleSubmit(onAwsSubmit)} className="space-y-4">
                    <FormField
                      control={awsForm.control}
                      name="accessKeyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Key ID</FormLabel>
                          <FormControl>
                            <Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your AWS Access Key ID from IAM
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
                            <Input type="password" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your AWS Secret Access Key from IAM
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
                          <FormLabel>Region (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="us-east-1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Default AWS region for your resources
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={addProviderMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {addProviderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CloudIcon className="mr-2 h-4 w-4" />
                            Connect AWS Account
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* GCP Form */}
              <TabsContent value="gcp" className="mt-4">
                <Form {...gcpForm}>
                  <form onSubmit={gcpForm.handleSubmit(onGcpSubmit)} className="space-y-4">
                    <FormField
                      control={gcpForm.control}
                      name="serviceAccountKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Account Key (JSON)</FormLabel>
                          <FormControl>
                            <textarea 
                              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder='{"type": "service_account", "project_id": "your-project-id", ...}'
                              {...field}
                            ></textarea>
                          </FormControl>
                          <FormDescription>
                            Paste your GCP Service Account key in JSON format
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
                            <Input placeholder="my-gcp-project" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your GCP Project ID (if not specified in the service account key)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={addProviderMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {addProviderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CloudIcon className="mr-2 h-4 w-4" />
                            Connect GCP Project
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Azure Form */}
              <TabsContent value="azure" className="mt-4">
                <Form {...azureForm}>
                  <form onSubmit={azureForm.handleSubmit(onAzureSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={azureForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client ID</FormLabel>
                            <FormControl>
                              <Input placeholder="00000000-0000-0000-0000-000000000000" {...field} />
                            </FormControl>
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
                              <Input type="password" placeholder="Your client secret" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={azureForm.control}
                        name="tenantId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant ID</FormLabel>
                            <FormControl>
                              <Input placeholder="00000000-0000-0000-0000-000000000000" {...field} />
                            </FormControl>
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
                              <Input placeholder="00000000-0000-0000-0000-000000000000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={addProviderMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {addProviderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CloudIcon className="mr-2 h-4 w-4" />
                            Connect Azure Account
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Connected Providers */}
      <div className="space-y-4">
        <h3 className="font-medium">Connected Providers</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : connectedAccounts && connectedAccounts.length > 0 ? (
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <Card key={account.id} className="overflow-hidden border border-border/60">
                <div className="flex flex-col md:flex-row">
                  <div className="flex items-center gap-4 p-4 md:p-6 flex-1">
                    <div className="flex-shrink-0">
                      {account.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{account.name}</h4>
                        {account.status === "active" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                        {account.status === "error" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        )}
                        {account.status === "disconnected" && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <CircleOff className="mr-1 h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{account.resourceCount} resources</span>
                        {account.lastSynced && (
                          <span>Last synced: {new Date(account.lastSynced).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col justify-end border-t md:border-t-0 md:border-l border-border/40 p-4 bg-muted/20">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={!account.isConnected || syncProviderMutation.isPending}
                      onClick={() => syncProviderMutation.mutate(account.id)}
                      className="text-sm"
                    >
                      {syncProviderMutation.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1 h-3 w-3" />
                      )}
                      Sync
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={disconnectProviderMutation.isPending}
                      onClick={() => disconnectProviderMutation.mutate(account.id)}
                      className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-muted/40 rounded-lg border border-border p-6 text-center">
            <CloudIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg mb-2">No cloud providers connected</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Connect your cloud providers to start monitoring and optimizing your infrastructure.
            </p>
            <Button onClick={() => setIsAddingProvider(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add your first provider
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}