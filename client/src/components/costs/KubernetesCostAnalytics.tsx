import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Define types for the real-time data
interface KubernetesCostData {
  currentCost: {
    totalCost: number;
    breakdown: {
      compute: number;
      memory: number;
      storage: number;
      networking: number;
    };
    percentChange: number;
    changeDirection: 'increase' | 'decrease';
  };
  projectedCost: {
    totalCost: number;
    percentChange: number;
  };
  potentialSavings: {
    totalSavings: number;
    recommendationCount: number;
  };
  utilization: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    saving: number;
    description: string;
  }>;
}

export default function KubernetesCostAnalytics() {
  // Fetch real-time Kubernetes cost data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/kubernetes/costs'],
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading real-time cost data...</span>
      </div>
    );
  }

  // If there was an error, show error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">Failed to load real-time cost data</div>
        <p className="text-muted-foreground mb-4">
          Unable to fetch the latest Kubernetes cost analytics. 
          Please ensure you have a Kubernetes cluster connected.
        </p>
        <Button>Retry</Button>
      </div>
    );
  }

  // Define a type for the API response that might contain a message
  interface ApiErrorResponse {
    message: string;
  }
  
  // Type guard to check if the response is an error message
  function isErrorResponse(data: any): data is ApiErrorResponse {
    return data && typeof data === 'object' && 'message' in data;
  }
  
  // Check if we received a message indicating no clusters
  if (isErrorResponse(data) && data.message === 'No Kubernetes clusters connected') {
    return (
      <div className="p-6 text-center border rounded-md">
        <div className="mb-4 text-amber-600 font-medium">No Kubernetes Cost Data Available</div>
        <p className="text-muted-foreground mb-4">
          Please connect a Kubernetes cluster to view detailed cost analytics and optimization recommendations.
        </p>
        <Button>Connect Kubernetes Cluster</Button>
      </div>
    );
  }
  
  // Use the actual data from the API response with a type assertion
  // We've already checked for error responses, so this is safe
  const costData: KubernetesCostData = data as KubernetesCostData;

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Real-Time Kubernetes Cost Analytics</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground mb-1">Current Cost</div>
          <div className="text-2xl font-bold">{formatCurrency(costData.currentCost.totalCost)}</div>
          <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          <div className={`mt-3 text-xs flex items-center ${
            costData.currentCost.changeDirection === 'decrease' ? 'text-green-600' : 'text-amber-600'
          }`}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={costData.currentCost.changeDirection === 'decrease' 
                  ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                  : "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"}
              />
            </svg>
            {costData.currentCost.percentChange.toFixed(1)}% from previous period
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground mb-1">Projected Cost</div>
          <div className="text-2xl font-bold">{formatCurrency(costData.projectedCost.totalCost)}</div>
          <div className="text-xs text-muted-foreground mt-1">Next 30 days</div>
          <div className="mt-3 text-xs flex items-center text-amber-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {costData.projectedCost.percentChange.toFixed(1)}% projected increase
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
          <div className="text-2xl font-bold">{formatCurrency(costData.potentialSavings.totalSavings)}</div>
          <div className="text-xs text-muted-foreground mt-1">From optimizations</div>
          <div className="mt-3 text-xs flex items-center text-blue-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {costData.potentialSavings.recommendationCount} recommendations available
          </div>
        </div>
      </div>
      
      {/* Cost breakdown */}
      <div className="mt-6 border rounded-md p-4">
        <h5 className="text-sm font-medium mb-3">Cost Breakdown</h5>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Compute (CPU)</span>
              <span>{formatCurrency(costData.currentCost.breakdown.compute)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ 
                width: `${Math.round((costData.currentCost.breakdown.compute / costData.currentCost.totalCost) * 100)}%` 
              }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Memory</span>
              <span>{formatCurrency(costData.currentCost.breakdown.memory)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ 
                width: `${Math.round((costData.currentCost.breakdown.memory / costData.currentCost.totalCost) * 100)}%` 
              }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Storage</span>
              <span>{formatCurrency(costData.currentCost.breakdown.storage)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ 
                width: `${Math.round((costData.currentCost.breakdown.storage / costData.currentCost.totalCost) * 100)}%` 
              }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Networking</span>
              <span>{formatCurrency(costData.currentCost.breakdown.networking)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ 
                width: `${Math.round((costData.currentCost.breakdown.networking / costData.currentCost.totalCost) * 100)}%` 
              }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-time resource utilization */}
      <div className="mt-6 border rounded-md p-4">
        <h5 className="text-sm font-medium mb-3">Resource Utilization</h5>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-32">CPU Utilization</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${costData.utilization.cpu}%` }}></div>
              </div>
            </div>
            <div className="w-12 text-right text-sm">{costData.utilization.cpu}%</div>
          </div>
          
          <div className="flex items-center">
            <div className="w-32">Memory Usage</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${costData.utilization.memory}%` }}></div>
              </div>
            </div>
            <div className="w-12 text-right text-sm">{costData.utilization.memory}%</div>
          </div>
          
          <div className="flex items-center">
            <div className="w-32">Storage Used</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${costData.utilization.storage}%` }}></div>
              </div>
            </div>
            <div className="w-12 text-right text-sm">{costData.utilization.storage}%</div>
          </div>
          
          <div className="flex items-center">
            <div className="w-32">Network I/O</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${costData.utilization.network}%` }}></div>
              </div>
            </div>
            <div className="w-12 text-right text-sm">{costData.utilization.network}%</div>
          </div>
        </div>
      </div>
      
      {/* Cost Optimization Recommendations */}
      <div className="mt-6 border rounded-md p-4">
        <h5 className="text-sm font-medium mb-3">Cost Optimization Recommendations</h5>
        
        <div className="space-y-3">
          {costData.recommendations.length > 0 ? (
            costData.recommendations.map(recommendation => (
              <div key={recommendation.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between">
                  <div className="font-medium">{recommendation.title}</div>
                  <div className="text-green-600 font-medium">Save {formatCurrency(recommendation.saving)}/mo</div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
                <Button variant="link" size="sm" className="p-0 h-auto text-sm mt-1">Apply recommendation</Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No recommendations available at this time
            </div>
          )}
        </div>
      </div>
    </div>
  );
}