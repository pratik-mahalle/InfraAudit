import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { AiAnalysisPanel } from '@/components/ai/AiAnalysisPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Database, HardDrive, Cloud, CloudOff } from 'lucide-react';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const resourceId = parseInt(id);

  // Fetch resource details
  const { data: resource, isLoading, error } = useQuery({
    queryKey: [`/api/resources/${resourceId}`],
    queryFn: () => apiRequest(`/api/resources/${resourceId}`),
    enabled: !isNaN(resourceId),
  });

  // Fetch recommendations for this resource
  const { data: recommendations } = useQuery({
    queryKey: ['/api/recommendations', resourceId],
    queryFn: () => apiRequest(`/api/recommendations?resourceId=${resourceId}`),
    enabled: !isNaN(resourceId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CloudOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Resource Not Found</h2>
        <p className="text-muted-foreground mt-2">
          We couldn't find the resource you're looking for.
        </p>
      </div>
    );
  }

  // Get the appropriate icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ec2':
      case 'vm':
      case 'compute':
        return <Server className="h-5 w-5" />;
      case 'rds':
      case 'database':
        return <Database className="h-5 w-5" />;
      case 's3':
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      default:
        return <Cloud className="h-5 w-5" />;
    }
  };

  // Format cost values
  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cost);
  };

  return (
    <>
      <Helmet>
        <title>{resource.name} | InfrAudit</title>
      </Helmet>

      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              {getResourceIcon(resource.type)}
              <h1 className="text-3xl font-bold">{resource.name}</h1>
              <Badge variant="outline" className="text-xs">
                {resource.type}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {resource.provider} • {resource.region} • ID: {resource.resourceId}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-muted-foreground">Monthly Cost</div>
            <div className="text-2xl font-bold">{formatCost(resource.cost || 0)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Overview</CardTitle>
                    <CardDescription>Key information about this resource</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Resource Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Type:</span>
                            <span className="text-sm font-medium">{resource.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Provider:</span>
                            <span className="text-sm font-medium">{resource.provider}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Region:</span>
                            <span className="text-sm font-medium">{resource.region}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Status:</span>
                            <span className="text-sm font-medium">{resource.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Created:</span>
                            <span className="text-sm font-medium">
                              {new Date(resource.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Cost Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current Cost:</span>
                            <span className="text-sm font-medium">{formatCost(resource.cost || 0)}/month</span>
                          </div>
                          {resource.costPerMonth && (
                            <div className="flex justify-between">
                              <span className="text-sm">Projected:</span>
                              <span className="text-sm font-medium">{formatCost(resource.costPerMonth)}/month</span>
                            </div>
                          )}
                          {resource.utilization !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm">Utilization:</span>
                              <span className="text-sm font-medium">{resource.utilization}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags and Metadata Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tags & Metadata</CardTitle>
                    <CardDescription>Additional resource information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resource.tags && Object.keys(resource.tags).length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(resource.tags).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags associated with this resource.</p>
                    )}

                    {resource.metadata && Object.keys(resource.metadata).length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Metadata</h3>
                        <div className="bg-muted/50 rounded-md p-4">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(resource.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Details</CardTitle>
                    <CardDescription>Detailed configuration information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-md p-4">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(resource, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Metrics</CardTitle>
                    <CardDescription>Performance and utilization metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        Resource metrics visualization coming soon!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* AI Analysis Panel */}
            <AiAnalysisPanel 
              resourceId={resourceId} 
              resourceName={resource.name} 
              resourceType={resource.type} 
            />

            {/* Recommendations Card */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>
                  Suggestions to improve cost, security, and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec: any) => (
                      <div key={rec.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium">{rec.title}</h4>
                              <Badge className="ml-2" variant={rec.type === 'cost' ? 'default' : rec.type === 'security' ? 'destructive' : 'outline'}>
                                {rec.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {rec.description}
                            </p>
                            {rec.estimatedSavings > 0 && (
                              <p className="text-sm font-medium text-green-600 mt-2">
                                Estimated savings: {formatCost(rec.estimatedSavings)}/month
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No recommendations yet. Click "Generate Recommendations" in the AI Analysis panel to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}