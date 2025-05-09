import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Percent, DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react";
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
  const { data: resources = [] } = useQuery({
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
      if (selectedResourceId) queryParams.set("resourceId", selectedResourceId);
      
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
      if (selectedResourceId) queryParams.set("resourceId", selectedResourceId);
      
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
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">AI Cost Prediction & Optimization</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Configure Analysis</CardTitle>
              <CardDescription>
                Set parameters for AI-powered cost prediction and optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource">Resource (Optional)</Label>
                <Select 
                  value={selectedResourceId || ""} 
                  onValueChange={value => setSelectedResourceId(value || null)}
                >
                  <SelectTrigger id="resource">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Resources</SelectItem>
                    {resources?.map((resource: any) => (
                      <SelectItem key={resource.id} value={resource.id.toString()}>
                        {resource.name} ({resource.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Prediction Period</Label>
                <Select value={monthsToPredict} onValueChange={setMonthsToPredict}>
                  <SelectTrigger id="period">
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
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button 
                onClick={handleRunPrediction} 
                disabled={isPredictionLoading}
                className="flex-1"
              >
                {isPredictionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Run Prediction
              </Button>
              <Button 
                onClick={handleGetRecommendations} 
                disabled={isRecommendationsLoading}
                variant="outline"
                className="flex-1"
              >
                {isRecommendationsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Percent className="mr-2 h-4 w-4" />
                )}
                Get Savings
              </Button>
            </CardFooter>
          </Card>

          {/* Results Area */}
          <div className="col-span-1 md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prediction">Cost Prediction</TabsTrigger>
                <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
              </TabsList>
              
              {/* Cost Prediction Tab */}
              <TabsContent value="prediction" className="space-y-4">
                {isPredictionLoading ? (
                  <Card>
                    <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Analyzing cost data and generating predictions...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : prediction ? (
                  <>
                    {/* Summary Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Cost Prediction Summary</CardTitle>
                        <CardDescription>
                          AI-powered analysis of future cloud costs
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Current Monthly Cost</div>
                            <div className="flex items-center mt-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-2xl font-bold">
                                {prediction.current_monthly_cost ? prediction.current_monthly_cost.toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Projected Monthly Cost</div>
                            <div className="flex items-center mt-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-2xl font-bold">
                                {prediction.average_predicted_cost ? prediction.average_predicted_cost.toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Growth Trend</div>
                            <div className="flex items-center mt-2">
                              <TrendingUp className={`h-4 w-4 mr-1 ${prediction.growth_percentage && prediction.growth_percentage > 0 ? 'text-red-500' : 'text-green-500'}`} />
                              <span className={`text-2xl font-bold ${prediction.growth_percentage && prediction.growth_percentage > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {prediction.growth_percentage ? Math.abs(prediction.growth_percentage).toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="font-medium mb-2">Projected Cost Over Time</h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartData()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`$${value}`, 'Projected Cost']} />
                                <Line type="monotone" dataKey="cost" stroke="#0066CC" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {prediction.cost_breakdown_by_service && (
                          <div className="mt-6">
                            <h3 className="font-medium mb-2">Cost Breakdown by Service</h3>
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getPieChartData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                  >
                                    {getPieChartData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Prediction generated on {new Date().toLocaleDateString()}
                        </p>
                      </CardFooter>
                    </Card>

                    {/* Insights Card */}
                    {prediction.insights && (
                      <Card>
                        <CardHeader>
                          <CardTitle>AI Insights</CardTitle>
                          <CardDescription>Key observations and analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {prediction.insights.map((insight: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-5 w-5 mr-2 text-blue-500 shrink-0 mt-0.5" />
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium mb-2">Run a prediction to see results</h3>
                        <p className="text-muted-foreground">
                          Configure your parameters and click "Run Prediction" to generate cost forecasts
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Cost Optimization Tab */}
              <TabsContent value="optimization" className="space-y-4">
                {isRecommendationsLoading ? (
                  <Card>
                    <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Analyzing cloud resources and generating optimization recommendations...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : recommendations ? (
                  <>
                    {/* Savings Summary Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Optimization Summary</CardTitle>
                        <CardDescription>
                          AI-generated recommendations for cost reduction
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Potential Monthly Savings</div>
                            <div className="flex items-center mt-2">
                              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-2xl font-bold text-green-500">
                                {recommendations.estimated_savings ? recommendations.estimated_savings.monthly.toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Annual Savings</div>
                            <div className="flex items-center mt-2">
                              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-2xl font-bold text-green-500">
                                {recommendations.estimated_savings ? recommendations.estimated_savings.annual.toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow">
                            <div className="text-sm font-medium text-muted-foreground">Savings Percentage</div>
                            <div className="flex items-center mt-2">
                              <Percent className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-2xl font-bold text-green-500">
                                {recommendations.estimated_savings ? recommendations.estimated_savings.percentage.toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations Card */}
                    {recommendations.recommendations && recommendations.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Detailed Recommendations</CardTitle>
                          <CardDescription>Step-by-step actions to optimize costs</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {recommendations.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium">{rec.title}</h3>
                                  {rec.estimated_savings && (
                                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      Save ${rec.estimated_savings.toFixed(2)}/mo
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                                
                                {rec.steps && (
                                  <div className="mt-2">
                                    <h4 className="text-sm font-medium mb-2">Implementation Steps:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                      {rec.steps.map((step: string, stepIndex: number) => (
                                        <li key={stepIndex}>{step}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {rec.resources && (
                                  <div className="mt-3 pt-3 border-t">
                                    <h4 className="text-sm font-medium mb-1">Affected Resources:</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {rec.resources.map((resource: string, resIndex: number) => (
                                        <span key={resIndex} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
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
                      <Card>
                        <CardHeader>
                          <CardTitle>Additional Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.additional_insights.map((insight: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-5 w-5 mr-2 text-blue-500 shrink-0 mt-0.5" />
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
                      <div className="text-center">
                        <Percent className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium mb-2">Run optimization analysis to see recommendations</h3>
                        <p className="text-muted-foreground">
                          Click "Get Savings" to generate AI-powered cost optimization recommendations
                        </p>
                      </div>
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