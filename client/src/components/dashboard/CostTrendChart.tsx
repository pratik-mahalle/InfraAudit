import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartTimeframe } from "@/types";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface CostTrendChartProps {
  timeframe: ChartTimeframe;
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
  currency?: string;
  isLoading?: boolean;
  trendDataPoints?: { date: string; cost: number }[];
}

export function CostTrendChart({
  timeframe,
  onTimeframeChange,
  currency = "USD",
  isLoading = false,
  trendDataPoints,
}: CostTrendChartProps) {
  const daysMap: Record<ChartTimeframe, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysMap[timeframe] + 1);

  const visiblePoints = (trendDataPoints ?? [])
    .filter((point) => new Date(point.date) >= cutoff)
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  const visibleTotal = visiblePoints.reduce((total, point) => total + point.cost, 0);
  const latestPoint = visiblePoints.at(-1);
  const chartData = {
    labels: visiblePoints.map((point) => {
      const date = new Date(point.date);
      return timeframe === "7d"
        ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }),
    datasets: [{
      label: "Imported actual cost",
      data: visiblePoints.map((point) => point.cost),
      borderColor: "#0066CC",
      backgroundColor: "rgba(0, 102, 204, 0.1)",
      fill: true,
      tension: 0.35,
      pointRadius: visiblePoints.length > 45 ? 0 : 2,
      pointHoverRadius: 5,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => `Imported cost: ${formatCurrency(Number(context.raw ?? 0), currency)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(127, 127, 127, 0.12)" },
        ticks: { callback: (value: string | number) => formatCurrency(Number(value), currency) },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Actual cost trend</CardTitle>
          <CardDescription className="mt-1">Stored provider billing evidence only. Forecasts and savings are kept out of this line.</CardDescription>
        </div>
        <Select value={timeframe} onValueChange={(value) => onTimeframeChange(value as ChartTimeframe)}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[230px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
          ) : visiblePoints.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No imported costs in this window</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">Sync billing data or widen the range. No synthetic chart points are generated.</p>
            </div>
          )}
        </div>
        {visiblePoints.length > 0 && (
          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Visible period total</p><p className="mt-1 font-semibold">{formatCurrency(visibleTotal, currency)}</p></div>
            <div><p className="text-xs text-muted-foreground">Latest imported point</p><p className="mt-1 font-semibold">{formatCurrency(latestPoint?.cost ?? 0, currency)}</p></div>
            <div><p className="text-xs text-muted-foreground">Evidence coverage</p><p className="mt-1 font-semibold">{visiblePoints.length} dated point{visiblePoints.length === 1 ? "" : "s"}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
