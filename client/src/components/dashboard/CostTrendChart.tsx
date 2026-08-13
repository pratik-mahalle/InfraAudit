import React, { useState } from "react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle } from "lucide-react";
import { ChartTimeframe } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CostTrendChartProps {
  currentSpend: number;
  projectedSpend: number;
  potentialSavings: number;
  optimizationCount: number;
  spendChange: number;
  projectionChange: number;
  isLoading?: boolean;
  /** Real data points from the Go backend /api/v1/costs/trends */
  trendDataPoints?: { date: string; cost: number }[];
}

export function CostTrendChart({
  currentSpend,
  projectedSpend,
  potentialSavings,
  optimizationCount,
  spendChange,
  projectionChange,
  isLoading = false,
  trendDataPoints,
}: CostTrendChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("7d");

  // Build chart data from real backend data points when available
  const buildChartData = (tf: ChartTimeframe) => {
    const now = new Date();
    const daysMap: Record<ChartTimeframe, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[tf] || 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    const realPoints = (trendDataPoints || [])
      .filter(dp => new Date(dp.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const labels = realPoints.map(dp => {
      const d = new Date(dp.date);
      return tf === "7d"
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const costData = realPoints.map(dp => dp.cost);
    const projectedCost = projectedSpend > 0 ? projectedSpend / (tf === "7d" ? 7 : tf === "30d" ? 30 : 90) : null;

    return {
      labels: projectedCost == null ? labels : [...labels, "Projected"],
      datasets: [
        {
          label: "Actual Cost",
          data: projectedCost == null ? costData : [...costData, null] as (number | null)[],
          borderColor: "#0066CC",
          backgroundColor: "rgba(0, 102, 204, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Projected",
          data: projectedCost == null ? [] : [...costData.map(() => null as number | null), projectedCost],
          borderColor: "#DC3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 5,
        },
      ],
    };
  };

  const chartData = buildChartData(timeframe);
  const hasTrendData = chartData.labels.length > 0;
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">Cost Trend Analysis</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as ChartTimeframe)}
          >
            <SelectTrigger className="h-8 text-xs border-gray-300 w-[110px]">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : hasTrendData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No cost trend data available</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">Sync billing data to populate this chart with real historical spend.</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="border-l-4 border-primary pl-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Spend</p>
            <p className="font-semibold text-lg font-inter">{formatCurrency(currentSpend)}</p>
            <p className={`text-xs flex items-center ${spendChange > 0 ? 'text-danger' : 'text-secondary'}`}>
              {spendChange > 0 ? (
                <ArrowUpRight className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3" />
              )}
              {spendChange > 0 ? '+' : ''}{spendChange}% vs last week
            </p>
          </div>
          <div className="border-l-4 border-danger pl-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Projected</p>
            <p className="font-semibold text-lg font-inter">{projectedSpend > 0 ? formatCurrency(projectedSpend) : "Not available"}</p>
            <p className={`text-xs flex items-center ${projectionChange > 0 ? 'text-danger' : 'text-secondary'}`}>
              {projectedSpend > 0 ? (
                <>
                  {projectionChange > 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {projectionChange > 0 ? '+' : ''}{projectionChange}% vs forecast
                </>
              ) : "Awaiting forecast"}
            </p>
          </div>
          <div className="border-l-4 border-warning pl-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Potential Savings</p>
            <p className="font-semibold text-lg font-inter">{formatCurrency(potentialSavings)}</p>
            <p className="text-xs text-secondary flex items-center">
              <CheckCircle className="mr-1 h-3 w-3" />
              {optimizationCount} optimization options
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
