import React, { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  useCostOverview,
  useCostForecast,
  useCostTrends,
  useCostAnomalies,
  useAIForecast,
  useSyncCosts,
} from "@/hooks/use-costs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Target,
  Brain,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ForecastModel = "linear" | "ma" | "wma";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "from-blue-500 to-blue-600",
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const MODEL_OPTIONS: { value: ForecastModel; label: string; desc: string }[] = [
  { value: "linear", label: "Linear", desc: "Best for steady growth trends" },
  { value: "ma", label: "Moving Avg", desc: "Smooths out cost spikes" },
  { value: "wma", label: "Weighted MA", desc: "Prioritizes recent data" },
];

const TIMEFRAMES = [
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
];

export default function CostPrediction() {
  const [model, setModel] = useState<ForecastModel>("linear");
  const [timeframe, setTimeframe] = useState(30);
  const [aiEnabled, setAIEnabled] = useState(false);

  const { data: overview, isLoading: overviewLoading } = useCostOverview();
  const { data: forecast, isLoading: forecastLoading } = useCostForecast("", timeframe, model);
  const { data: trends } = useCostTrends();
  const { data: anomalies } = useCostAnomalies("open", 5, 0);
  const syncMutation = useSyncCosts();
  const aiMutation = useAIForecast();

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => toast.success("Cost data synced"),
      onError: () => toast.error("Failed to sync cost data"),
    });
  };

  const handleToggleAI = () => {
    if (!aiEnabled) {
      setAIEnabled(true);
      if (!aiMutation.data && !aiMutation.isPending) {
        aiMutation.mutate(undefined, {
          onError: () => toast.error("AI analysis failed — check your Gemini API key"),
        });
      }
    } else {
      setAIEnabled(false);
    }
  };

  // Build combined chart data: historical (actual) + forecast (predicted)
  const chartData = React.useMemo(() => {
    const points: { date: string; actual?: number; forecast?: number; lower?: number; upper?: number }[] = [];
    if (forecast?.historical) {
      for (const h of forecast.historical) {
        points.push({ date: h.date, actual: h.cost });
      }
    }
    if (forecast?.dataPoints) {
      for (const p of forecast.dataPoints) {
        points.push({ date: p.date, forecast: p.cost, lower: p.lowerBound, upper: p.upperBound });
      }
    }
    return points;
  }, [forecast]);

  // Weekly breakdown from forecast data points
  const weeklyData = React.useMemo(() => {
    if (!forecast?.dataPoints?.length) return [];
    const weeks: { week: string; predicted: number; lower: number; upper: number }[] = [];
    const pts = forecast.dataPoints;
    for (let i = 0; i < pts.length; i += 7) {
      const chunk = pts.slice(i, i + 7);
      const total = chunk.reduce((s, p) => s + p.cost, 0);
      const lower = chunk.reduce((s, p) => s + p.lowerBound, 0);
      const upper = chunk.reduce((s, p) => s + p.upperBound, 0);
      weeks.push({
        week: chunk.length < 7 ? `Week ${weeks.length + 1} (partial)` : `Week ${weeks.length + 1}`,
        predicted: total,
        lower,
        upper,
      });
    }
    return weeks;
  }, [forecast]);

  const trendIcon =
    overview?.trend?.trend === "up" ? TrendingUp :
    overview?.trend?.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    overview?.trend?.trend === "up" ? "text-red-500" :
    overview?.trend?.trend === "down" ? "text-green-500" : "text-gray-500";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Cost Prediction
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Statistical forecasting based on your billing history and scan data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
            Sync Costs
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Current Month"
            value={overview ? `$${overview.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$—"}
            color="from-blue-500 to-blue-600"
            loading={overviewLoading}
          />
          <StatCard
            icon={Target}
            label={`${timeframe}-Day Forecast`}
            value={forecast ? `$${forecast.forecastedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$—"}
            sub={`Model: ${model.toUpperCase()}`}
            color="from-violet-500 to-violet-600"
            loading={forecastLoading}
          />
          <StatCard
            icon={BarChart3}
            label="Confidence"
            value={forecast ? `${Math.round((forecast.confidenceLevel ?? 0) * 100)}%` : "—"}
            sub={forecast?.historical?.length ? `Based on ${forecast.historical.length} days of data` : "No history yet"}
            color={
              (forecast?.confidenceLevel ?? 0) >= 0.7 ? "from-green-500 to-green-600" :
              (forecast?.confidenceLevel ?? 0) >= 0.4 ? "from-yellow-500 to-yellow-600" :
              "from-red-500 to-red-600"
            }
            loading={forecastLoading}
          />
          <StatCard
            icon={trendIcon}
            label="Cost Trend"
            value={overview?.trend ? `${overview.trend.changePercent > 0 ? "+" : ""}${overview.trend.changePercent.toFixed(1)}%` : "—"}
            sub={overview?.trend?.trend ?? "stable"}
            color="from-orange-500 to-orange-600"
            loading={overviewLoading}
          />
        </div>

        <Tabs defaultValue="forecast" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="forecast" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Forecast */}
          <TabsContent value="forecast" className="space-y-6 mt-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forecast Model</p>
                <div className="flex gap-2">
                  {MODEL_OPTIONS.map((m) => (
                    <Button
                      key={m.value}
                      size="sm"
                      variant={model === m.value ? "default" : "outline"}
                      onClick={() => setModel(m.value)}
                      title={m.desc}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horizon</p>
                <div className="flex gap-2">
                  {TIMEFRAMES.map((t) => (
                    <Button
                      key={t.value}
                      size="sm"
                      variant={timeframe === t.value ? "default" : "outline"}
                      onClick={() => setTimeframe(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Low confidence warning */}
            {!forecastLoading && forecast && (forecast.confidenceLevel ?? 1) < 0.4 && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Limited historical data — forecast accuracy may be low. Import billing data or run more scans to improve predictions.
                </p>
              </div>
            )}

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Forecast</CardTitle>
                <CardDescription>
                  Historical actual costs (solid) + {timeframe}-day forecast (dashed) with confidence interval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
                    <BarChart3 className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No cost data available yet.</p>
                    <p className="text-xs text-gray-400">Import billing data or run a scan to see forecasts.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v.slice(5)}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        width={70}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#actualGrad)"
                        connectNulls={false}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="forecast"
                        name="Forecast"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        fill="url(#forecastGrad)"
                        connectNulls={false}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        name="Lower Bound"
                        stroke="none"
                        strokeWidth={0}
                        fill="#8b5cf6"
                        fillOpacity={0}
                        dot={false}
                        legendType="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="upper"
                        name="Confidence Band"
                        stroke="#8b5cf6"
                        strokeWidth={0}
                        fill="#8b5cf6"
                        fillOpacity={0.08}
                        dot={false}
                        legendType="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Weekly breakdown */}
            {weeklyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekly Forecast Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 pr-4 text-gray-500 font-medium">Week</th>
                          <th className="text-right py-2 px-4 text-gray-500 font-medium">Predicted</th>
                          <th className="text-right py-2 px-4 text-gray-500 font-medium">Lower</th>
                          <th className="text-right py-2 pl-4 text-gray-500 font-medium">Upper</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((w) => (
                          <tr key={w.week} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">{w.week}</td>
                            <td className="py-2.5 px-4 text-right text-violet-600 dark:text-violet-400 font-semibold">
                              ${w.predicted.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-500">${w.lower.toFixed(2)}</td>
                            <td className="py-2.5 pl-4 text-right text-gray-500">${w.upper.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Analysis */}
          <TabsContent value="analysis" className="space-y-6 mt-6">
            {/* Top services */}
            {overview?.topServices && overview.topServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost by Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={overview.topServices.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 80, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="serviceName" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                      <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Provider breakdown */}
            {overview?.byProvider && Object.keys(overview.byProvider).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cost by Provider</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(overview.byProvider).map(([provider, amount]) => (
                    <Card key={provider}>
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 capitalize">{provider}</p>
                          <Badge variant="secondary" className="capitalize">{provider}</Badge>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent anomalies */}
            {anomalies && anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Recent Cost Anomalies
                  </CardTitle>
                  <CardDescription>Anomalies may affect forecast accuracy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {anomalies.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{a.serviceName || a.provider}</p>
                        <p className="text-xs text-gray-500">{a.anomalyType} · {a.deviation?.toFixed(1)}% deviation</p>
                      </div>
                      <Badge
                        className={cn(
                          "capitalize",
                          a.severity === "critical" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          a.severity === "high" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                          a.severity === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        )}
                        variant="outline"
                      >
                        {a.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!overviewLoading && !overview?.topServices?.length && !anomalies?.length && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">No analysis data available yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Import billing data or connect a cloud provider to see analysis.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: AI Insights */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Gemini AI Analysis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered cost forecast and recommendations</p>
              </div>
              <Button
                variant={aiEnabled ? "default" : "outline"}
                className="gap-2"
                onClick={handleToggleAI}
              >
                <Sparkles className="h-4 w-4" />
                {aiEnabled ? "AI Enabled" : "Enable AI Analysis"}
              </Button>
            </div>

            {!aiEnabled && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center space-y-3">
                  <Brain className="h-10 w-10 mx-auto text-violet-400" />
                  <p className="font-medium text-gray-900 dark:text-white">AI Analysis powered by Gemini</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Enable to get a natural-language cost analysis including trend summary, key cost drivers, risk factors, and actionable recommendations.
                  </p>
                  <Button variant="default" className="gap-2 mt-2" onClick={handleToggleAI}>
                    <Sparkles className="h-4 w-4" />
                    Enable AI Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {aiEnabled && aiMutation.isPending && (
              <Card>
                <CardContent className="py-12 flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <p className="text-sm text-gray-500">Analyzing your cost data with Gemini AI...</p>
                </CardContent>
              </Card>
            )}

            {aiEnabled && aiMutation.isError && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="py-8 text-center space-y-3">
                  <AlertTriangle className="h-8 w-8 mx-auto text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">AI analysis failed. Check that GEMINI_API_KEY is configured on the server.</p>
                  <Button variant="outline" size="sm" onClick={() => aiMutation.mutate(undefined)}>Retry</Button>
                </CardContent>
              </Card>
            )}

            {aiEnabled && aiMutation.isSuccess && aiMutation.data && (
              <div className="space-y-4">
                {/* Summary */}
                <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
                  <CardContent className="pt-5">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiMutation.data.summary}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cost Drivers */}
                  {aiMutation.data.costDrivers?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Cost Drivers</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiMutation.data.costDrivers.map((d, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{d}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Risk Factors */}
                  {aiMutation.data.riskFactors?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Risk Factors</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiMutation.data.riskFactors.map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{r}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {aiMutation.data.recommendations?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-700 dark:text-gray-300">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiMutation.data.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Target className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{rec}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* 30/60/90 day forecast from AI */}
                {(aiMutation.data.forecast30d || aiMutation.data.forecast60d || aiMutation.data.forecast90d) && (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "30-Day AI Forecast", value: aiMutation.data.forecast30d },
                      { label: "60-Day AI Forecast", value: aiMutation.data.forecast60d },
                      { label: "90-Day AI Forecast", value: aiMutation.data.forecast90d },
                    ].map((f) => f.value ? (
                      <Card key={f.label}>
                        <CardContent className="pt-5">
                          <p className="text-xs text-gray-500">{f.label}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            ${f.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </CardContent>
                      </Card>
                    ) : null)}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
