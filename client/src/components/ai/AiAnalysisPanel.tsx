import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CheckCircle, XCircle, BarChart, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AiAnalysisPanelProps {
  resourceId: number;
  resourceName: string;
  resourceType: string;
}

export function AiAnalysisPanel({ resourceId, resourceName, resourceType }: AiAnalysisPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cost');

  // Query to fetch existing anomalies and drifts from Go backend
  const { data: costAnomalies, isLoading: isLoadingCost } = useQuery({
    queryKey: ['/api/v1/costs/anomalies', resourceId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/v1/costs/anomalies?resourceId=${resourceId}`);
      return await res.json();
    },
    select: (data: any) => {
      const unwrapped = data?.data ?? data ?? [];
      return Array.isArray(unwrapped) ? unwrapped : [];
    },
  });

  const { data: securityDrifts, isLoading: isLoadingSecurity } = useQuery({
    queryKey: ['/api/drifts', resourceId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/drifts?resourceId=${resourceId}`);
      return await res.json();
    },
    select: (data: any) => {
      const unwrapped = data?.data ?? data ?? [];
      return Array.isArray(unwrapped) ? unwrapped : (unwrapped?.data ?? []);
    },
  });

  // Mutations for running AI analysis — uses drift detect + cost anomaly detect endpoints
  const costAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/v1/costs/anomalies/detect');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Cost Analysis Complete',
        description: 'Cost anomaly detection has been triggered.',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze cost anomalies',
        variant: 'destructive',
      });
    }
  });

  const securityAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/drifts/detect');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Security Analysis Complete',
        description: 'Drift detection has been triggered.',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/drifts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze security drifts',
        variant: 'destructive',
      });
    }
  });

  const recommendationsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/recommendations/generate'),
    onSuccess: (data) => {
      toast({
        title: 'Recommendations Generated',
        description: `Generated ${data.recommendations?.length || 0} optimization recommendations`,
        variant: 'default',
      });
      
      // Invalidate the recommendations query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Generate Recommendations',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  });

  // Determine severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-blue-500" />
          AI-Powered Analysis
        </CardTitle>
        <CardDescription>
          Use advanced AI to detect cost anomalies and security configuration drifts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cost" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cost" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cost" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Cost Anomaly Detection</h3>
              <Button
                onClick={() => costAnalysisMutation.mutate()}
                disabled={costAnalysisMutation.isPending}
                variant="default"
                size="sm"
              >
                {costAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Costs
                  </>
                )}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              {isLoadingCost ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : costAnomalies && costAnomalies.length > 0 ? (
                <div className="space-y-4">
                  {costAnomalies.map((anomaly: any) => (
                    <div key={anomaly.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                            <h4 className="font-medium">Cost Anomaly Detected</h4>
                            <Badge className={`ml-2 ${getSeverityColor(anomaly.severity)}`}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {anomaly.description}
                          </p>
                          {anomaly.amount > 0 && (
                            <p className="text-sm font-medium text-red-600 mt-2">
                              Estimated waste: ${anomaly.amount.toFixed(2)}/month
                            </p>
                          )}
                        </div>
                        <Badge variant={anomaly.status === 'open' ? 'outline' : 'secondary'}>
                          {anomaly.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium">No Cost Anomalies Detected</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your resource costs appear to be within normal ranges.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Security Drift Detection</h3>
              <Button
                onClick={() => securityAnalysisMutation.mutate()}
                disabled={securityAnalysisMutation.isPending}
                variant="default"
                size="sm"
              >
                {securityAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Analyze Security
                  </>
                )}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              {isLoadingSecurity ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : securityDrifts && securityDrifts.length > 0 ? (
                <div className="space-y-4">
                  {securityDrifts.map((drift: any) => (
                    <div key={drift.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <h4 className="font-medium">Security Drift Detected</h4>
                            <Badge className={`ml-2 ${getSeverityColor(drift.severity)}`}>
                              {drift.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {drift.description}
                          </p>
                        </div>
                        <Badge variant={drift.status === 'open' ? 'outline' : 'secondary'}>
                          {drift.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium">No Security Drifts Detected</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your resource security configurations look good.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="text-sm text-muted-foreground">
          AI-powered analysis for {resourceName} ({resourceType})
        </div>
        <Button
          onClick={() => recommendationsMutation.mutate()}
          disabled={recommendationsMutation.isPending}
          variant="outline"
          size="sm"
        >
          {recommendationsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Generate Recommendations
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}