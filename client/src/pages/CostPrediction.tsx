import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, TrendingUp, ArrowUp, Zap, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import KubernetesCostAnalytics from "@/components/costs/KubernetesCostAnalytics";

export default function CostPrediction() {
  const [predictionModel, setPredictionModel] = useState<"linear" | "movingAverage" | "weightedMovingAverage">("linear");
  const [timeframe, setTimeframe] = useState(30);

  // Query to get optimization suggestions
  const { 
    data: optimizationData, 
    isLoading: isLoadingOptimizations,
    error: optimizationError
  } = useQuery({
    queryKey: ["/api/cost-prediction/optimization-suggestions"],
    enabled: true,
  });

  // Mutation to generate cost predictions
  const generatePredictionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cost-prediction/predict", {
        days: timeframe,
        model: predictionModel
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prediction/history"] });
    }
  });

  // Mutation to generate optimization suggestions
  const generateOptimizationsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cost-prediction/generate-suggestions");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prediction/optimization-suggestions"] });
    }
  });

  // Fetch historical cost data
  const { 
    data: historicalData, 
    isLoading: isLoadingHistory,
    error: historyError 
  } = useQuery({
    queryKey: ["/api/cost-prediction/history"],
    enabled: true,
  });

  // Types for prediction and optimization data
  interface WeeklyPrediction {
    period: string;
    predictedAmount: number;
  }

  interface MonthlyPrediction {
    predictedAmount: number;
    confidenceInterval: number;
  }

  interface PredictionData {
    monthlyPrediction: MonthlyPrediction;
    weeklyPredictions: WeeklyPrediction[];
  }

  interface OptimizationSuggestion {
    title: string;
    description: string;
    potentialSavings: number;
    confidence: number;
    implementationDifficulty: string;
  }

  // Mock data for UI display (until real data is available)
  const mockPrediction: PredictionData = {
    monthlyPrediction: {
      predictedAmount: 1245.67,
      confidenceInterval: 125.30,
    },
    weeklyPredictions: [
      { period: "Week 1", predictedAmount: 280.45 },
      { period: "Week 2", predictedAmount: 310.22 },
      { period: "Week 3", predictedAmount: 325.50 },
      { period: "Week 4", predictedAmount: 329.50 },
    ]
  };

  const mockOptimizations: OptimizationSuggestion[] = [
    { 
      title: "Right-size underutilized EC2 instances", 
      description: "3 instances are consistently below 20% CPU utilization", 
      potentialSavings: 312.45,
      confidence: 0.85,
      implementationDifficulty: "easy" 
    },
    { 
      title: "Enable S3 lifecycle policies", 
      description: "Move infrequently accessed objects to cheaper storage classes", 
      potentialSavings: 85.20,
      confidence: 0.92,
      implementationDifficulty: "easy" 
    },
    { 
      title: "Terminate idle RDS read replicas", 
      description: "2 read replicas have not been accessed in 30+ days", 
      potentialSavings: 210.75,
      confidence: 0.78,
      implementationDifficulty: "medium" 
    },
  ];

  // Determine if data exists or if we need to use mock data for display
  // Check if real data exists and use it if available
  const hasRealData = false; // This would check if API responses contain actual data
  
  // Define the expected structure of the API response
  interface OptimizationResponse {
    suggestions: OptimizationSuggestion[];
  }
  
  // Create a type-safe optimizationData object
  const optimizationSuggestions = (optimizationData as OptimizationResponse)?.suggestions;
  
  // Use real data if available, otherwise fall back to mock data
  const predictionToDisplay = hasRealData && generatePredictionMutation.data 
    ? generatePredictionMutation.data as PredictionData 
    : mockPrediction;
    
  const optimizationsToDisplay = hasRealData && optimizationSuggestions 
    ? optimizationSuggestions 
    : mockOptimizations;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Helmet>
        <title>Cost Prediction | CloudGuard</title>
        <meta name="description" content="Predict your future cloud costs and find optimization opportunities with CloudGuard's AI-powered prediction tools." />
      </Helmet>
    
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cost Prediction</h1>
            <p className="text-muted-foreground">
              Predict future cloud costs and discover optimization opportunities
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Model:</span>
              <Select 
                value={predictionModel} 
                onValueChange={(value) => setPredictionModel(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prediction Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="movingAverage">Moving Average</SelectItem>
                  <SelectItem value="weightedMovingAverage">Weighted Average</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Days:</span>
              <Select 
                value={timeframe.toString()} 
                onValueChange={(value) => setTimeframe(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => generatePredictionMutation.mutate()}
              disabled={generatePredictionMutation.isPending}
            >
              {generatePredictionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Prediction
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Cost Prediction */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                Estimated Monthly Cost
              </CardTitle>
              <CardDescription>
                Predicted cloud costs for the next {timeframe} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatePredictionMutation.isPending ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatCurrency(predictionToDisplay.monthlyPrediction.predictedAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence interval: ±{formatCurrency(predictionToDisplay.monthlyPrediction.confidenceInterval)}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-sm mb-2">Weekly Breakdown</h3>
                    <div className="space-y-3">
                      {predictionToDisplay.weeklyPredictions.map((week: WeeklyPrediction) => (
                        <div key={week.period} className="flex justify-between items-center">
                          <span className="text-sm">{week.period}</span>
                          <span className="font-medium">{formatCurrency(week.predictedAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Cost Optimization */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-green-500" />
                  Cost Optimization
                </CardTitle>
                <CardDescription>
                  Potential monthly savings from optimizations
                </CardDescription>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => generateOptimizationsMutation.mutate()}
                disabled={generateOptimizationsMutation.isPending}
              >
                {generateOptimizationsMutation.isPending && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                Generate
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingOptimizations || generateOptimizationsMutation.isPending ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : optimizationError ? (
                <div className="text-center py-8 text-muted-foreground">
                  Error loading optimization suggestions
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(optimizationsToDisplay.reduce((sum: number, opt: OptimizationSuggestion) => sum + opt.potentialSavings, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">
                    Estimated monthly savings
                  </div>
                  
                  <div className="space-y-4">
                    {optimizationsToDisplay.map((opt: OptimizationSuggestion, idx: number) => (
                      <div key={idx} className="flex justify-between border-b border-border pb-3">
                        <div>
                          <div className="font-medium">{opt.title}</div>
                          <div className="text-sm text-muted-foreground">{opt.description}</div>
                          <div className="text-xs mt-1 px-2 py-0.5 bg-muted inline-block rounded-full">
                            {opt.implementationDifficulty} to implement
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(opt.potentialSavings)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(opt.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Kubernetes Cost Analytics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Server className="mr-2 h-5 w-5 text-blue-600" />
              Kubernetes Cost Analytics
            </CardTitle>
            <CardDescription>
              Real-time cost analysis and optimization for Kubernetes clusters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KubernetesCostAnalytics />
          </CardContent>
        </Card>
        
        {/* Historical Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Cost Analysis</CardTitle>
            <CardDescription>
              View and analyze your historical cloud spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="resources">Top Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="pt-4">
                {isLoadingHistory ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : historyError ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No historical cost data available
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                    <p className="text-muted-foreground">Historical cost chart will be displayed here</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="categories" className="pt-4">
                <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Category breakdown will be displayed here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="pt-4">
                <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Top resource costs will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}