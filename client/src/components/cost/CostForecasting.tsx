import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";
import { Loader2, AlertTriangle, Bookmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CostData {
  date: string;
  actual: number;
  forecast: number;
}

interface CostForecastingProps {
  historicalData?: CostData[];
  monthlyBudget?: number;
  forecastTotal?: number;
  isLoading?: boolean;
  onUpdateBudget?: (budget: number) => void;
}

export function CostForecasting({ 
  historicalData = [], 
  monthlyBudget = 5000, 
  forecastTotal = 0,
  isLoading = false,
  onUpdateBudget
}: CostForecastingProps) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());

  const handleSaveBudget = () => {
    const newBudget = parseInt(budgetInput);
    if (!isNaN(newBudget) && newBudget > 0) {
      onUpdateBudget?.(newBudget);
      setEditingBudget(false);
    }
  };

  const exceededBudget = forecastTotal > monthlyBudget;
  const warningThreshold = monthlyBudget * 0.8;
  const approachingBudget = forecastTotal > warningThreshold && forecastTotal <= monthlyBudget;
  
  // Calculate the increase percentage
  const lastMonthCost = historicalData.length > 0 ? 
    historicalData[historicalData.length - 2]?.actual || 0 : 0;
  const percentageIncrease = lastMonthCost === 0 ? 0 : 
    ((forecastTotal - lastMonthCost) / lastMonthCost) * 100;

  // Merge historical and forecast data for display
  const chartData = [...historicalData];

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cost Forecasting</CardTitle>
          <CardDescription>
            Predicted costs based on historical usage patterns
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Monthly Budget</span>
            {editingBudget ? (
              <div className="flex items-center gap-2">
                <Input
                  className="w-24 h-8"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  type="number"
                  min="0"
                />
                <Button size="sm" onClick={handleSaveBudget}>Save</Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditingBudget(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatCurrency(monthlyBudget)}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingBudget(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing cost data and generating forecast...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Current Month Forecast</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {formatCurrency(forecastTotal)}
                    <Badge 
                      className={`ml-2 ${percentageIncrease > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {percentageIncrease > 0 ? '+' : ''}{percentageIncrease.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Monthly Budget</CardDescription>
                  <CardTitle className="text-3xl">{formatCurrency(monthlyBudget)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Budget Status</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {exceededBudget ? (
                      <>
                        <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                        <span className="text-red-500">Exceeded</span>
                      </>
                    ) : approachingBudget ? (
                      <>
                        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                        <span className="text-yellow-500">Warning</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-6 w-6 text-green-500 mr-2" />
                        <span className="text-green-500">On Budget</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {exceededBudget && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Budget Alert</AlertTitle>
                <AlertDescription>
                  Your forecasted spending of {formatCurrency(forecastTotal)} is expected to exceed your budget of {formatCurrency(monthlyBudget)} by {formatCurrency(forecastTotal - monthlyBudget)}.
                </AlertDescription>
              </Alert>
            )}

            {approachingBudget && (
              <Alert variant="warning" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Budget Warning</AlertTitle>
                <AlertDescription>
                  Your forecasted spending of {formatCurrency(forecastTotal)} is approaching your budget of {formatCurrency(monthlyBudget)}.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="monthly">
              <TabsList className="mb-4">
                <TabsTrigger value="monthly">Monthly View</TabsTrigger>
                <TabsTrigger value="daily">Daily View</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly">
                <div className="rounded-md border bg-card p-4 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [`$${value}`, 'Cost']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <ReferenceLine 
                        y={monthlyBudget} 
                        stroke="red" 
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Budget', 
                          position: 'right',
                          fill: 'red',
                          fontSize: 12
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8884d8" 
                        name="Actual Cost" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#82ca9d" 
                        name="Forecast"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="daily">
                <div className="rounded-md border bg-card p-4 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.slice(-30)} // Show last 30 days
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [`$${value}`, 'Cost']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <ReferenceLine 
                        y={monthlyBudget / 30} 
                        stroke="red" 
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Daily Budget', 
                          position: 'right',
                          fill: 'red',
                          fontSize: 12
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8884d8" 
                        name="Actual Cost" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#82ca9d" 
                        name="Forecast"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}