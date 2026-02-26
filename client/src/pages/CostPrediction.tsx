import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCostOverview, useCostForecast, useCostTrends, useCostOptimizations, useSyncCosts, useCostAnomalies } from "@/hooks/use-costs";
import type { CostOverview, CostForecast, CostTrend, CostOptimization } from "@/types";
import { useRecommendations } from "@/hooks/use-recommendations";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Components
import { PredictionGauge } from "@/components/prediction/PredictionGauge";
import { CostBreakdownChart } from "@/components/prediction/CostBreakdownChart";
import { SavingsOpportunities } from "@/components/prediction/SavingsOpportunities";
import { ForecastChart } from "@/components/prediction/ForecastChart";
import KubernetesCostAnalytics from "@/components/costs/KubernetesCostAnalytics";

// Icons
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Brain,
  Sparkles,
  Calculator,
  ArrowRight,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Lightbulb,
  Rocket,
  Cpu,
  HardDrive,
  Database,
  Globe,
  Cloud
} from "lucide-react";

export default function CostPrediction() {
  const [predictionModel, setPredictionModel] = useState<"linear" | "movingAverage" | "weightedMovingAverage">("linear");
  const [timeframe, setTimeframe] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real data hooks — fetching from Go backend via api.costs.*
  const { data: overviewData, isLoading: isLoadingOverview } = useCostOverview();
  const { data: forecastData, isLoading: isLoadingForecast } = useCostForecast('', timeframe);
  const { data: trendsData, isLoading: isLoadingTrends } = useCostTrends();
  const { data: optimizationsData, isLoading: isLoadingOptimizations } = useCostOptimizations();
  const { data: recommendationsData } = useRecommendations();

  // Sync costs mutation (triggers cost sync from cloud providers)
  const syncCostsMutation = useSyncCosts();

  const handleGenerateForecast = () => {
    toast({
      title: "Generating Forecast",
      description: "Syncing cost data and generating predictions...",
    });
    syncCostsMutation.mutate(undefined, {
      onSuccess: () => {
        // Invalidate all cost-related queries to ensure all charts and widgets are updated
        queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
        toast({
          title: "Forecast Updated",
          description: "Cost forecast has been updated with latest data.",
        });
      },
      onError: () => {
        toast({
          title: "Sync Failed",
          description: "Unable to sync cost data. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Derive stats from real API data
  const overview = overviewData as CostOverview | undefined;
  const forecast = forecastData as CostForecast | undefined;
  const trends = trendsData as CostTrend | undefined;
  const optimizations = (Array.isArray(optimizationsData) ? optimizationsData : []) as CostOptimization[];

  const stats = {
    currentSpend: overview?.monthlyCost ?? 0,
    predictedSpend: forecast?.forecastedCost ?? 0,
    budget: forecast?.upperBound ?? Math.ceil((overview?.monthlyCost ?? 0) * 1.3),
    previousMonth: trends?.previousCost ?? 0,
    potentialSavings: overview?.potentialSavings ?? 0,
    savingsOpportunities: optimizations.length,
    accuracy: forecast?.confidenceLevel ?? 0,
  };

  // Build cost breakdown from real overview by-service data
  const costCategoryIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    "Compute": { icon: <Cpu className="h-4 w-4" />, color: "#3b82f6" },
    "Storage": { icon: <HardDrive className="h-4 w-4" />, color: "#10b981" },
    "Database": { icon: <Database className="h-4 w-4" />, color: "#8b5cf6" },
    "Networking": { icon: <Globe className="h-4 w-4" />, color: "#f59e0b" },
    "Other": { icon: <Cloud className="h-4 w-4" />, color: "#6b7280" },
  };

  const categoryColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#6b7280", "#ef4444", "#06b6d4"];

  const costBreakdownData = (() => {
    const byService = (overview as any)?.byService;
    if (byService && typeof byService === 'object' && Object.keys(byService).length > 0) {
      return Object.entries(byService).map(([name, value], i) => ({
        name,
        value: typeof value === 'number' ? value : 0,
        color: categoryColors[i % categoryColors.length],
        icon: costCategoryIcons[name]?.icon ?? <Cloud className="h-4 w-4" />,
        change: 0,
      }));
    }
    return undefined; // let component use its default
  })();

  // Map optimizations to SavingsOpportunities format
  const savingsOpportunities = optimizations.length > 0
    ? optimizations.map((opt, i) => ({
      id: opt.id ?? String(i),
      title: opt.optimizationType ?? 'Optimization',
      description: opt.description ?? '',
      potentialSavings: opt.estimatedSavings ?? 0,
      confidence: opt.confidence ?? 80,
      difficulty: 'medium' as 'easy' | 'medium' | 'hard',
      category: 'compute' as const,
      impact: 'medium' as const,
      timeToImplement: '1-2 hours',
      affectedResources: 1,
    }))
    : undefined; // let component use its default

  // Build AI insights from real recommendations
  const aiInsights = (() => {
    const recs = Array.isArray((recommendationsData as any)?.data) ? (recommendationsData as any).data : [];
    if (recs.length > 0) {
      return recs.slice(0, 3).map((rec: any) => ({
        icon: rec.type === 'cost_optimization'
          ? <AlertTriangle className="h-4 w-4" />
          : rec.type === 'security_improvement'
            ? <CheckCircle2 className="h-4 w-4" />
            : <Clock className="h-4 w-4" />,
        title: rec.title ?? 'Recommendation',
        description: rec.description ?? '',
        type: rec.priority === 'critical' || rec.priority === 'high' ? 'warning' : rec.type === 'cost_optimization' ? 'success' : 'info',
      }));
    }
    return null; // will use fallback
  })();

  // Build ForecastChart data from real trends + forecast
  const forecastChartData = (() => {
    const points: { date: string; actual: number; forecast?: number; budget?: number; lowerBound?: number; upperBound?: number }[] = [];
    const trendPoints = (trends as any)?.dataPoints as { date: string; cost: number }[] | undefined;
    const budgetLine = stats.budget > 0 ? Math.round(stats.budget / 30) : undefined; // daily budget

    // Historical data from trends
    if (trendPoints && trendPoints.length > 0) {
      for (const dp of trendPoints) {
        const d = new Date(dp.date);
        points.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actual: Math.round(dp.cost),
          budget: budgetLine,
        });
      }
    }

    // Future projection from forecast
    if (forecast && forecast.forecastedCost > 0) {
      const daysToForecast = timeframe;
      const dailyForecast = forecast.forecastedCost / timeframe;
      const dailyLower = forecast.lowerBound / timeframe;
      const dailyUpper = forecast.upperBound / timeframe;
      const today = new Date();

      for (let i = 1; i <= daysToForecast; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const uncertainty = i * 2; // grows with time
        points.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actual: undefined as any,
          forecast: Math.round(dailyForecast),
          budget: budgetLine,
          lowerBound: Math.max(0, Math.round(dailyLower - uncertainty)),
          upperBound: Math.round(dailyUpper + uncertainty),
        });
      }
    }

    return points.length > 0 ? points : undefined; // undefined = component uses its default
  })();

  // Compute weekly forecast breakdown from forecast data
  const weekCount = Math.min(Math.max(Math.ceil(timeframe / 7), 1), 4);
  const weeklyForecast = (() => {
    if (!forecast) {
      return Array.from({ length: weekCount }, (_, i) => ({
        week: `Week ${i + 1}`,
        amount: 0,
        change: 0,
      }));
    }
    const baseWeekly = forecast.forecastedCost / weekCount;
    const changeRate = (trends?.changePercent ?? 0) / 100;
    return Array.from({ length: weekCount }, (_, i) => ({
      week: `Week ${i + 1}`,
      amount: Math.round(baseWeekly * (1 + changeRate * (i / Math.max(weekCount - 1, 1)))),
      change: parseFloat((Math.abs(changeRate) * 100 * ((i + 1) / weekCount)).toFixed(1)),
    }));
  })();

  return (
    <>
      <Helmet>
        <title>Cost Prediction | InfraAudit</title>
        <meta name="description" content="AI-powered cloud cost prediction and optimization recommendations." />
      </Helmet>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Minimalist Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Cost <span className="font-semibold">Prediction</span>
            </h1>
            <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 opacity-70" />
              Machine learning powered forecasts
              <span className="text-muted-foreground/30">•</span>
              {stats.accuracy}% accuracy
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Select
              value={predictionModel}
              onValueChange={(value) => setPredictionModel(value as any)}
            >
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="movingAverage">Moving Average</SelectItem>
                <SelectItem value="weightedMovingAverage">Weighted Average</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={timeframe.toString()}
              onValueChange={(value) => setTimeframe(parseInt(value))}
            >
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerateForecast}
              disabled={syncCostsMutation.isPending}
              variant="default"
              className="gap-2"
            >
              {syncCostsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Update
            </Button>
          </div>
        </div>

        {/* Clean Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-border/40 w-full justify-start rounded-none p-0 h-auto">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="forecast"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Forecast
            </TabsTrigger>
            <TabsTrigger
              value="optimization"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Optimization
            </TabsTrigger>
            <TabsTrigger
              value="kubernetes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Kubernetes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Clean Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Current Month",
                      value: formatCurrency(stats.currentSpend),
                      change: trends ? `${trends.changePercent > 0 ? '+' : ''}${trends.changePercent.toFixed(1)}%` : '--',
                      trend: trends?.trend ?? "stable",
                    },
                    {
                      label: "Predicted Total",
                      value: formatCurrency(stats.predictedSpend),
                      change: stats.currentSpend > 0 && stats.predictedSpend > 0
                        ? `${stats.predictedSpend >= stats.currentSpend ? '+' : ''}${((stats.predictedSpend - stats.currentSpend) / stats.currentSpend * 100).toFixed(1)}%`
                        : '--',
                      trend: stats.predictedSpend > stats.currentSpend ? "up" : stats.predictedSpend < stats.currentSpend ? "down" : "stable",
                    },
                    {
                      label: "Potential Savings",
                      value: formatCurrency(stats.potentialSavings),
                      change: `${stats.savingsOpportunities} insights`,
                      trend: "down",
                    },
                    {
                      label: "Budget Remaining",
                      value: formatCurrency(Math.max(stats.budget - stats.currentSpend, 0)),
                      change: stats.budget > 0 ? `${Math.round(((stats.budget - stats.currentSpend) / stats.budget) * 100)}% left` : '--',
                      trend: "stable",
                    }
                  ].map((stat, i) => (
                    <Card key={i} className="rounded-xl shadow-none border-border/50">
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground tracking-tight">{stat.label}</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-semibold tracking-tight">{stat.value}</span>
                        </div>
                        <div className="mt-3 flex items-center text-sm font-medium">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md",
                            stat.trend === "up" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                              stat.trend === "down" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                "bg-secondary text-secondary-foreground"
                          )}>
                            {stat.change}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PredictionGauge
                    currentSpend={stats.currentSpend}
                    predictedSpend={stats.predictedSpend}
                    budget={stats.budget}
                    previousMonthSpend={stats.previousMonth}
                  />
                  <CostBreakdownChart data={costBreakdownData} totalCost={stats.currentSpend || undefined} />
                </div>

                <ForecastChart data={forecastChartData} budget={stats.budget > 0 ? Math.round(stats.budget / 30) : undefined} model={predictionModel} />

                {/* Clean ROI Calculator CTA */}
                <Card className="rounded-xl shadow-none border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                          <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
                            Calculate Your Return on Investment
                          </h3>
                          <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                            Estimate how much you could save with our optimization features.
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                        <a href="/roi-calculator" className="flex items-center gap-2">
                          Open Calculator
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "forecast" && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ForecastChart data={forecastChartData} budget={stats.budget > 0 ? Math.round(stats.budget / 30) : undefined} model={predictionModel} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PredictionGauge
                    currentSpend={stats.currentSpend}
                    predictedSpend={stats.predictedSpend}
                    budget={stats.budget}
                    previousMonthSpend={stats.previousMonth}
                  />

                  <Card className="rounded-xl shadow-none border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 opacity-70" />
                        Weekly Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weeklyForecast.map((item, index) => (
                          <div
                            key={item.week}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">{item.week}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                              <p className={cn(
                                "text-xs",
                                item.change > 5 ? "text-red-500" : "text-muted-foreground"
                              )}>
                                +{item.change}% vs avg
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "optimization" && (
              <motion.div
                key="optimization"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <SavingsOpportunities
                  opportunities={savingsOpportunities}
                  onApply={(id) => {
                    toast({
                      title: "Recommendation Applied",
                      description: "The optimization has been scheduled for implementation.",
                    });
                  }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CostBreakdownChart data={costBreakdownData} totalCost={stats.currentSpend || undefined} />

                  <Card className="rounded-xl shadow-none border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 opacity-70" />
                        AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(aiInsights ?? [
                        {
                          title: "Connect Cloud Providers",
                          description: "Add your AWS, Azure, or GCP accounts to get real AI-powered insights",
                          type: "warning"
                        },
                        {
                          title: "Sync Cost Data",
                          description: "Click 'Update' to sync your latest cost data",
                          type: "success"
                        },
                        {
                          title: "AI Analysis Ready",
                          description: "Identify patterns and savings automatically",
                          type: "info"
                        }
                      ]).map((insight: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg border border-border/40 bg-card/50 flex flex-col gap-1"
                        >
                          <h4 className="text-sm font-medium text-foreground">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "kubernetes" && (
              <motion.div
                key="kubernetes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-xl shadow-none border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Server className="h-4 w-4 opacity-70" />
                      Cluster Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KubernetesCostAnalytics />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
