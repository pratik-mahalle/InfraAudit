import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { 
  ArrowRight, Percent, DollarSign, TrendingUp, Calendar, Loader2, 
  ShieldAlert, Database, AlertTriangle, HardDrive, User, Clock,
  ShieldCheck, DollarSign as Dollar
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Prediction period options
const predictionPeriods = [
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" }
];

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF66B2'];

export default function CostPrediction() {
  const { toast } = useToast();
  const [monthsToPredict, setMonthsToPredict] = useState("3");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("prediction");

  // Fetch resources for the dropdown
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    enabled: true,
  });

  // Fetch cost prediction from the AI service
  const {
    data: prediction,
    isLoading: isPredictionLoading,
    refetch: refetchPrediction
  } = useQuery({
    queryKey: ["/api/ai-cost/predict", monthsToPredict, selectedResourceId],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (monthsToPredict) queryParams.set("months", monthsToPredict);
      // Only send resourceId if it's not "all"
      if (selectedResourceId && selectedResourceId !== "all") {
        queryParams.set("resourceId", selectedResourceId);
      }
      
      const response = await fetch(`/api/ai-cost/predict?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cost prediction");
      }
      return response.json();
    },
    enabled: false, // Don't fetch on component mount
  });

  // Fetch cost optimization recommendations from the AI service
  const {
    data: recommendations,
    isLoading: isRecommendationsLoading,
    refetch: refetchRecommendations
  } = useQuery({
    queryKey: ["/api/ai-cost/optimize", selectedResourceId],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      // Only send resourceId if it's not "all"
      if (selectedResourceId && selectedResourceId !== "all") {
        queryParams.set("resourceId", selectedResourceId);
      }
      
      const response = await fetch(`/api/ai-cost/optimize?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch optimization recommendations");
      }
      return response.json();
    },
    enabled: false, // Don't fetch on component mount
  });

  // Generate the chart data based on the prediction results
  const getChartData = () => {
    if (!prediction || !prediction.monthly_predictions) return [];
    
    return prediction.monthly_predictions.map((month: any) => ({
      name: new Date(month.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      cost: Math.round(month.predicted_cost * 100) / 100,
    }));
  };

  // Generate pie chart data for cost by service
  const getPieChartData = () => {
    if (!prediction || !prediction.cost_breakdown_by_service) return [];
    
    const services = prediction.cost_breakdown_by_service as Record<string, number>;
    return Object.keys(services).map(service => ({
      name: service,
      value: services[service],
    }));
  };

  // Handle prediction request
  const handleRunPrediction = async () => {
    try {
      await refetchPrediction();
      setActiveTab("prediction");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch cost prediction",
        variant: "destructive",
      });
    }
  };

  // Handle optimization request
  const handleGetRecommendations = async () => {
    try {
      await refetchRecommendations();
      setActiveTab("optimization");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch optimization recommendations",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full py-3 md:py-5 space-y-6">
        {/* Header section with gradient background */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-5 mb-6 shadow-sm border border-blue-100/50 dark:border-blue-800/20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                AI Cost Intelligence
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Leverage advanced AI to forecast future cloud costs and identify optimization opportunities across your infrastructure
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <RadioGroup defaultValue="standard" className="grid grid-cols-2 h-9 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-900/50 p-1 text-muted-foreground shadow-sm border border-blue-100/70 dark:border-blue-800/30">
                <div 
                  className={`px-4 ${activeTab === 'prediction' ? 'bg-blue-100/80 dark:bg-blue-900/30 shadow-sm rounded-md text-blue-700 dark:text-blue-300' : ''} cursor-pointer flex items-center justify-center h-7`} 
                  onClick={() => setActiveTab('prediction')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Forecast</span>
                </div>
                <div 
                  className={`px-4 ${activeTab === 'optimization' ? 'bg-green-100/80 dark:bg-green-900/30 shadow-sm rounded-md text-green-700 dark:text-green-300' : ''} cursor-pointer flex items-center justify-center h-7`} 
                  onClick={() => setActiveTab('optimization')}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Optimize</span>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div className="w-full space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">AI RECOMMENDATIONS</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-900 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-border/40 pb-3 px-6">
                  <CardTitle className="text-base text-gray-800 dark:text-gray-200 font-semibold tracking-tight">
                    SECURITY & MISCONFIGURATION INSIGHTS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5">
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          S3 bucket 'logs-backup' became public on 3 occasions
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Consider setting policy to prevent public ACLs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          IAM Role 'admin-devops' has wildcard '*' permissions across 12 services
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Use least-privilege policy
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          Unattached EBS volumes: Attach to instances or delete
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          5 volumes consuming unnecessary resources
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-border/40 pb-3 px-6">
                  <CardTitle className="text-base text-gray-800 dark:text-gray-200 font-semibold tracking-tight">
                    COST OPTIMIZATION RECOMMENDATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5">
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <Dollar className="h-5 w-5 text-green-600 dark:text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          EC2 instance i-xyz123 at 5% utilized for 7 days
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Downsizing or stopping to save costs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <Dollar className="h-5 w-5 text-green-600 dark:text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          Switch to a Reserved instance for EC2 (linux-prod)
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Savings {">"}$90/mo with 1-year commitment
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          RDS 'mysql-prod' backup retention at 35 days
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reduce to 14 days to save storage costs
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-border/40 pb-3 px-6">
                  <CardTitle className="text-base text-gray-800 dark:text-gray-200 font-semibold tracking-tight">
                    ANOMALY DETECTION
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5">
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          VPC 'prod-vpc' 300% Ingress traffic in past 24 hours
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Unusual compared to baseline levels
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          Sudden IAM policy change without staging
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Suspect privilege escalation attempt
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-border/40 pb-3 px-6">
                  <CardTitle className="text-base text-gray-800 dark:text-gray-200 font-semibold tracking-tight">
                    INFRASTRUCTURE HYGIENE SUGGESTIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5">
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          3 orphaned Load Balancers with 0 backend instances
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Delete to avoid unnecessary costs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          4 IAM users haven{"'"}t logged in for {">"}90 days
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Deactivate or remove unused accounts
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-5">
          {/* Configuration Card */}
          <Card className="md:col-span-1 lg:col-span-3 bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </span>
                Configure Analysis
              </CardTitle>
              <CardDescription>
                Set parameters for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resource" className="text-sm font-medium">Resource</Label>
                  <Select 
                    value={selectedResourceId || "all"} 
                    onValueChange={value => setSelectedResourceId(value)}
                  >
                    <SelectTrigger id="resource" className="bg-background">
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resources?.map((resource: Resource) => (
                        <SelectItem key={resource.id} value={resource.id.toString()}>
                          {resource.name} ({resource.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Select specific resource or analyze all</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period" className="text-sm font-medium">Prediction Period</Label>
                  <Select value={monthsToPredict} onValueChange={setMonthsToPredict}>
                    <SelectTrigger id="period" className="bg-background">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {predictionPeriods.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">How far into the future to predict</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <Button 
                  onClick={handleRunPrediction} 
                  disabled={isPredictionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isPredictionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  Generate Prediction
                </Button>
                <Button 
                  onClick={handleGetRecommendations} 
                  disabled={isRecommendationsLoading}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  {isRecommendationsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Percent className="mr-2 h-4 w-4" />
                  )}
                  Find Savings
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Results Area */}
          <div className="md:col-span-3 lg:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prediction">Cost Prediction</TabsTrigger>
                <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
              </TabsList>
              
              {/* Cost Prediction Tab */}
              <TabsContent value="prediction" className="space-y-6">
                {isPredictionLoading ? (
                  <Card className="border border-border/50 overflow-hidden">
                    <CardContent className="p-8 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">AI is analyzing your cloud costs</h3>
                        <p className="text-muted-foreground max-w-md">
                          Our AI is analyzing historical usage patterns and current resource configuration to generate accurate cost predictions...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : prediction ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Current Monthly</p>
                              <div className="flex items-baseline">
                                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500 mr-1" />
                                <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                  {prediction.current_monthly_cost ? prediction.current_monthly_cost.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-blue-900/30 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                          </div>
                          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">Your current cloud spend average</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Projected Monthly</p>
                              <div className="flex items-baseline">
                                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-500 mr-1" />
                                <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                                  {prediction.average_predicted_cost ? prediction.average_predicted_cost.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-purple-900/30 p-2 rounded-full">
                              <TrendingUp className="h-5 w-5 text-purple-500" />
                            </div>
                          </div>
                          <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">Average projected monthly cost</p>
                        </CardContent>
                      </Card>
                      
                      <Card className={`${prediction.growth_percentage && prediction.growth_percentage > 0 
                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800/50' 
                        : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800/50'}`}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-sm font-medium ${prediction.growth_percentage && prediction.growth_percentage > 0
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-green-700 dark:text-green-400'} mb-1`}>Growth Trend</p>
                              <div className="flex items-baseline">
                                {prediction.growth_percentage && prediction.growth_percentage > 0 
                                  ? <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-500 mr-1" />
                                  : <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-500 mr-1" />}
                                <span className={`text-3xl font-bold ${prediction.growth_percentage && prediction.growth_percentage > 0
                                  ? 'text-red-700 dark:text-red-400'
                                  : 'text-green-700 dark:text-green-400'}`}>
                                  {prediction.growth_percentage ? Math.abs(prediction.growth_percentage).toFixed(1) : '0.0'}%
                                </span>
                              </div>
                            </div>
                            <div className={`${prediction.growth_percentage && prediction.growth_percentage > 0
                                ? 'bg-white dark:bg-red-900/30'
                                : 'bg-white dark:bg-green-900/30'} p-2 rounded-full`}>
                              {prediction.growth_percentage && prediction.growth_percentage > 0 
                                ? <Percent className="h-5 w-5 text-red-500" />
                                : <Percent className="h-5 w-5 text-green-500" />}
                            </div>
                          </div>
                          <p className={`text-xs ${prediction.growth_percentage && prediction.growth_percentage > 0
                            ? 'text-red-600/70 dark:text-red-400/70'
                            : 'text-green-600/70 dark:text-green-400/70'} mt-2`}>
                            {prediction.growth_percentage && prediction.growth_percentage > 0
                              ? 'Cost is projected to increase'
                              : 'Cost is projected to remain stable or decrease'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Line Chart */}
                      <Card className="border border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">Cost Projection Timeline</CardTitle>
                          <CardDescription>
                            Future cloud costs over the next {monthsToPredict} months
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={{ stroke: '#e2e8f0' }}
                                  tickLine={false}
                                  tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis 
                                  axisLine={{ stroke: '#e2e8f0' }}
                                  tickLine={false}
                                  tick={{ fill: '#64748b', fontSize: 12 }}
                                  tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip 
                                  formatter={(value) => [`$${value}`, 'Projected Cost']} 
                                  contentStyle={{ 
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                  labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="cost" 
                                  stroke="#0066CC" 
                                  strokeWidth={2}
                                  dot={{ stroke: '#0066CC', strokeWidth: 2, r: 4, fill: '#fff' }}
                                  activeDot={{ stroke: '#0066CC', strokeWidth: 2, r: 6, fill: '#0066CC' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pie Chart */}
                      {prediction.cost_breakdown_by_service && (
                        <Card className="border border-border/50 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">Cost Breakdown by Service</CardTitle>
                            <CardDescription>
                              Distribution of cloud costs across services
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getPieChartData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                  >
                                    {getPieChartData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']} 
                                    contentStyle={{ 
                                      background: 'rgba(255, 255, 255, 0.9)',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '6px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  />
                                  <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Insights Card */}
                    {prediction.insights && (
                      <Card className="border border-border/50 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md mr-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </span>
                            AI Insights & Analysis
                          </CardTitle>
                          <CardDescription>
                            Key observations from your cloud usage patterns
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3 mt-2">
                            {prediction.insights.map((insight: string, index: number) => (
                              <li key={index} className="flex items-start p-3 rounded-lg bg-white dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-1 rounded text-blue-700 dark:text-blue-400 mr-3 mt-0.5">
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                                <span className="text-sm">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Prediction generated on {new Date().toLocaleDateString()} using OpenAI GPT-4o model
                          </p>
                        </CardFooter>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed border-2 border-muted bg-muted/20">
                    <CardContent className="p-8 flex flex-col justify-center items-center min-h-[400px]">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Run a cost prediction</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        Select your parameters and click "Generate Prediction" to see AI-powered cost forecasts and insights
                      </p>
                      <Button onClick={handleRunPrediction} className="bg-blue-600 hover:bg-blue-700">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Start Prediction
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Cost Optimization Tab */}
              <TabsContent value="optimization" className="space-y-6">
                {isRecommendationsLoading ? (
                  <Card className="border border-border/50 overflow-hidden">
                    <CardContent className="p-8 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Finding cost-saving opportunities</h3>
                        <p className="text-muted-foreground max-w-md">
                          Our AI is analyzing your cloud infrastructure to identify inefficiencies and recommend optimization strategies...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : recommendations ? (
                  <>
                    {/* Savings Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Monthly Savings</p>
                              <div className="flex items-baseline">
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500 mr-1" />
                                <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                                  {recommendations.estimated_savings ? recommendations.estimated_savings.monthly.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-green-900/30 p-2 rounded-full">
                              <Percent className="h-5 w-5 text-green-500" />
                            </div>
                          </div>
                          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">Potential monthly cost reduction</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Annual Savings</p>
                              <div className="flex items-baseline">
                                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500 mr-1" />
                                <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                  {recommendations.estimated_savings ? recommendations.estimated_savings.annual.toFixed(2) : '0.00'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-blue-900/30 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                          </div>
                          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">Projected savings over 12 months</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800/50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Savings Percentage</p>
                              <div className="flex items-baseline">
                                <Percent className="h-4 w-4 text-purple-600 dark:text-purple-500 mr-1" />
                                <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                                  {recommendations.estimated_savings ? recommendations.estimated_savings.percentage.toFixed(1) : '0.0'}%
                                </span>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-purple-900/30 p-2 rounded-full">
                              <TrendingUp className="h-5 w-5 text-purple-500" />
                            </div>
                          </div>
                          <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">Percent reduction in total cloud spend</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recommendations Card */}
                    {recommendations.recommendations && recommendations.recommendations.length > 0 && (
                      <Card className="border border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <span className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-md mr-2">
                              <Percent className="h-4 w-4 text-green-600" />
                            </span>
                            Optimization Recommendations
                          </CardTitle>
                          <CardDescription>
                            Actionable steps to reduce your cloud costs
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-5 mt-2">
                            {recommendations.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="p-5 rounded-lg bg-white dark:bg-card border border-border/80 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                                  <h3 className="font-medium text-lg flex items-center">
                                    <span className="bg-green-100 text-green-700 p-1 rounded-md mr-2">
                                      <TrendingUp className="h-4 w-4" />
                                    </span>
                                    {rec.title}
                                  </h3>
                                  {rec.estimated_savings && (
                                    <div className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full text-sm flex items-center gap-1 whitespace-nowrap">
                                      <DollarSign className="h-3.5 w-3.5" />
                                      <span>Save {rec.estimated_savings.toFixed(2)}/mo</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-muted-foreground mb-4">{rec.description}</p>
                                
                                {rec.steps && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <h4 className="font-medium mb-2 flex items-center text-sm">
                                      <span className="bg-blue-100 text-blue-700 p-1 rounded-md mr-2">
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </span>
                                      Implementation Steps
                                    </h4>
                                    <ul className="space-y-2 pl-6">
                                      {rec.steps.map((step: string, stepIndex: number) => (
                                        <li key={stepIndex} className="text-sm relative before:absolute before:content-[''] before:w-1.5 before:h-1.5 before:bg-green-400 before:rounded-full before:left-[-20px] before:top-[7px]">
                                          {step}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {rec.resources && (
                                  <div className="mt-4 pt-3 border-t border-border/50">
                                    <h4 className="text-sm font-medium mb-2">Affected Resources:</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {rec.resources.map((resource: string, resIndex: number) => (
                                        <span key={resIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                          {resource}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Additional Insights */}
                    {recommendations.additional_insights && (
                      <Card className="border border-border/50 bg-amber-50/50 dark:bg-amber-950/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <span className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md mr-2">
                              <Calendar className="h-4 w-4 text-amber-600" />
                            </span>
                            Long-term Optimization Insights
                          </CardTitle>
                          <CardDescription>
                            Strategic recommendations for sustainable cost management
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3 mt-2">
                            {recommendations.additional_insights.map((insight: string, index: number) => (
                              <li key={index} className="flex items-start p-3 rounded-lg bg-white dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                                <div className="bg-amber-100 dark:bg-amber-900/40 p-1 rounded text-amber-700 dark:text-amber-400 mr-3 mt-0.5">
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                                <span className="text-sm">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Analysis generated on {new Date().toLocaleDateString()} using OpenAI GPT-4o model
                          </p>
                        </CardFooter>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed border-2 border-muted bg-muted/20">
                    <CardContent className="p-8 flex flex-col justify-center items-center min-h-[400px]">
                      <div className="rounded-full bg-green-100 p-3 mb-4">
                        <Percent className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Discover cost-saving opportunities</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        Find ways to optimize your cloud spend with AI-powered recommendations tailored to your infrastructure
                      </p>
                      <Button onClick={handleGetRecommendations} className="border-green-600 text-green-600 hover:bg-green-50" variant="outline">
                        <Percent className="mr-2 h-4 w-4" />
                        Get Optimization Recommendations
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}