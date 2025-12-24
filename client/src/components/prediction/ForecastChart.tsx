import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  Target,
  Info,
  Download
} from "lucide-react";

interface ForecastDataPoint {
  date: string;
  actual: number;
  forecast?: number;
  budget?: number;
  lowerBound?: number;
  upperBound?: number;
}

interface ForecastChartProps {
  data?: ForecastDataPoint[];
  budget?: number;
  model?: "linear" | "movingAverage" | "weightedMovingAverage";
  isLoading?: boolean;
}

const generateMockData = (): ForecastDataPoint[] => {
  const data: ForecastDataPoint[] = [];
  const today = new Date();
  let baseValue = 600;
  
  // Historical data (past 30 days)
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const variation = Math.random() * 100 - 50;
    const trend = (30 - i) * 3;
    const actual = Math.max(400, baseValue + variation + trend);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: Math.round(actual),
      budget: 850
    });
  }
  
  // Forecast data (next 14 days)
  let lastActual = data[data.length - 1].actual;
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const trend = i * 5;
    const forecast = lastActual + trend + (Math.random() * 30 - 15);
    const uncertainty = i * 8;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: undefined as any,
      forecast: Math.round(forecast),
      budget: 850,
      lowerBound: Math.round(forecast - uncertainty),
      upperBound: Math.round(forecast + uncertainty)
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {data.actual && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Actual: ${data.actual.toLocaleString()}
          </p>
        )}
        {data.forecast && (
          <>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Forecast: ${data.forecast.toLocaleString()}
            </p>
            {data.lowerBound && data.upperBound && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Range: ${data.lowerBound.toLocaleString()} - ${data.upperBound.toLocaleString()}
              </p>
            )}
          </>
        )}
        {data.budget && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
            Budget: ${data.budget.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function ForecastChart({
  data,
  budget = 850,
  model = "linear",
  isLoading = false
}: ForecastChartProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  
  const chartData = data || generateMockData();
  
  // Calculate stats
  const actualData = chartData.filter(d => d.actual);
  const forecastData = chartData.filter(d => d.forecast);
  const avgActual = actualData.reduce((sum, d) => sum + (d.actual || 0), 0) / actualData.length;
  const lastForecast = forecastData[forecastData.length - 1]?.forecast || 0;
  const projectedTotal = forecastData.reduce((sum, d) => sum + (d.forecast || 0), 0);
  
  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Cost Forecast
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered prediction based on usage patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-2 h-6">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2 h-6">30D</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs px-2 h-6">90D</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Daily Cost</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${Math.round(avgActual).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-gray-500 dark:text-gray-400">14-Day Projection</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ${Math.round(projectedTotal).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily Budget</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              ${budget.toLocaleString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Confidence interval area */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#confidenceGradient)"
                name="Confidence Range"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#fff"
                name=""
              />
              
              {/* Actual cost area */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#actualGradient)"
                name="Actual Cost"
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
              
              {/* Forecast area */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#forecastGradient)"
                name="Forecast"
                dot={false}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
              
              {/* Budget reference line */}
              <ReferenceLine 
                y={budget} 
                stroke="#f59e0b" 
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: "Budget",
                  position: "right",
                  fill: "#f59e0b",
                  fontSize: 11
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Info */}
        <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">Forecast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-amber-500" style={{ borderTop: "2px dashed #f59e0b" }} />
              <span className="text-gray-600 dark:text-gray-400">Budget</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="h-3.5 w-3.5" />
            <span>Using {model === "linear" ? "Linear Regression" : model === "movingAverage" ? "Moving Average" : "Weighted Average"} model</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

