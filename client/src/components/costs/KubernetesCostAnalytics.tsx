import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server, TrendingUp, TrendingDown, Zap, Cpu, HardDrive, Wifi } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

// Default/mock data to display when no real data is available
const defaultCostData: KubernetesCostData = {
  currentCost: {
    totalCost: 2450.00,
    breakdown: {
      compute: 1200.00,
      memory: 650.00,
      storage: 380.00,
      networking: 220.00
    },
    percentChange: 8.5,
    changeDirection: 'increase'
  },
  projectedCost: {
    totalCost: 2680.00,
    percentChange: 9.4
  },
  potentialSavings: {
    totalSavings: 485.00,
    recommendationCount: 4
  },
  utilization: {
    cpu: 62,
    memory: 78,
    storage: 45,
    network: 34
  },
  recommendations: [
    {
      id: '1',
      title: 'Right-size underutilized pods',
      saving: 185.00,
      description: '12 pods have CPU requests 3x higher than actual usage'
    },
    {
      id: '2',
      title: 'Enable cluster autoscaling',
      saving: 150.00,
      description: 'Scale down during off-peak hours to reduce costs'
    },
    {
      id: '3',
      title: 'Use spot instances for batch workloads',
      saving: 95.00,
      description: '3 batch jobs can run on interruptible spot instances'
    },
    {
      id: '4',
      title: 'Optimize persistent volume claims',
      saving: 55.00,
      description: '5 PVCs are provisioned but barely used'
    }
  ]
};

export default function KubernetesCostAnalytics() {
  // Fetch real-time Kubernetes cost data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/kubernetes/costs'],
    retry: 1,
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
        <span className="ml-2 text-muted-foreground">Loading Kubernetes cost data...</span>
      </div>
    );
  }

  // Type guard to check if data has the expected structure
  function isValidCostData(data: any): data is KubernetesCostData {
    return data && 
           typeof data === 'object' && 
           data.currentCost && 
           typeof data.currentCost.totalCost === 'number';
  }

  // Define a type for the API response that might contain a message
  interface ApiErrorResponse {
    message: string;
  }
  
  // Type guard to check if the response is an error message
  function isErrorResponse(data: any): data is ApiErrorResponse {
    return data && typeof data === 'object' && 'message' in data;
  }
  
  // Check if we received a message indicating no clusters or invalid data
  const showEmptyState = error || 
                         !data || 
                         (isErrorResponse(data) && data.message) ||
                         !isValidCostData(data);

  // Use real data if valid, otherwise use default mock data
  const costData: KubernetesCostData = isValidCostData(data) ? data : defaultCostData;
  const isUsingMockData = !isValidCostData(data);

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-500" />
          Kubernetes Cost Analytics
        </h4>
        {isUsingMockData && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Sample Data
          </span>
        )}
      </div>
      
      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20"
        >
          <div className="text-sm text-muted-foreground mb-1">Current Cost</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(costData.currentCost.totalCost)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          <div className={cn(
            "mt-3 text-xs flex items-center",
            costData.currentCost.changeDirection === 'decrease' ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {costData.currentCost.changeDirection === 'decrease' ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {costData.currentCost.percentChange.toFixed(1)}% from previous period
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20"
        >
          <div className="text-sm text-muted-foreground mb-1">Projected Cost</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {formatCurrency(costData.projectedCost.totalCost)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Next 30 days</div>
          <div className="mt-3 text-xs flex items-center text-amber-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            {costData.projectedCost.percentChange.toFixed(1)}% projected increase
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
        >
          <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(costData.potentialSavings.totalSavings)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">From optimizations</div>
          <div className="mt-3 text-xs flex items-center text-blue-600">
            <Zap className="h-3 w-3 mr-1" />
            {costData.potentialSavings.recommendationCount} recommendations available
          </div>
        </motion.div>
      </div>
      
      {/* Cost breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50"
      >
        <h5 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-500" />
          Cost Breakdown
        </h5>
        
        <div className="space-y-4">
          {[
            { name: 'Compute (CPU)', value: costData.currentCost.breakdown.compute, color: 'bg-blue-500', total: costData.currentCost.totalCost },
            { name: 'Memory', value: costData.currentCost.breakdown.memory, color: 'bg-violet-500', total: costData.currentCost.totalCost },
            { name: 'Storage', value: costData.currentCost.breakdown.storage, color: 'bg-emerald-500', total: costData.currentCost.totalCost },
            { name: 'Networking', value: costData.currentCost.breakdown.networking, color: 'bg-amber-500', total: costData.currentCost.totalCost }
          ].map((item, index) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full rounded-full", item.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((item.value / item.total) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Real-time resource utilization */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-4 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50"
      >
        <h5 className="text-sm font-medium mb-4 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-violet-500" />
          Resource Utilization
        </h5>
        
        <div className="space-y-3">
          {[
            { name: 'CPU Utilization', value: costData.utilization.cpu, color: 'bg-blue-500' },
            { name: 'Memory Usage', value: costData.utilization.memory, color: 'bg-violet-500' },
            { name: 'Storage Used', value: costData.utilization.storage, color: 'bg-emerald-500' },
            { name: 'Network I/O', value: costData.utilization.network, color: 'bg-amber-500' }
          ].map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-600 dark:text-gray-400">{item.name}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className={cn("h-full rounded-full", item.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                  />
                </div>
              </div>
              <div className={cn(
                "w-12 text-right text-sm font-medium",
                item.value > 80 ? "text-red-500" : item.value > 60 ? "text-amber-500" : "text-emerald-500"
              )}>
                {item.value}%
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Cost Optimization Recommendations */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="p-4 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50"
      >
        <h5 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-500" />
          Cost Optimization Recommendations
        </h5>
        
        <div className="space-y-3">
          {costData.recommendations.length > 0 ? (
            costData.recommendations.map((recommendation, index) => (
              <motion.div 
                key={recommendation.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700/60 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{recommendation.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Save {formatCurrency(recommendation.saving)}
                    </div>
                    <span className="text-xs text-gray-500">/month</span>
                  </div>
                </div>
                <Button variant="link" size="sm" className="p-0 h-auto text-sm mt-2 text-blue-600 dark:text-blue-400">
                  Apply recommendation →
                </Button>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6">
              No recommendations available at this time
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Connect CTA if using mock data */}
      {isUsingMockData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Connect your Kubernetes cluster to see real-time cost analytics
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Server className="h-4 w-4 mr-2" />
            Connect Kubernetes Cluster
          </Button>
        </motion.div>
      )}
    </div>
  );
}
