import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Rocket
} from "lucide-react";

export default function CostPrediction() {
  const [predictionModel, setPredictionModel] = useState<"linear" | "movingAverage" | "weightedMovingAverage">("linear");
  const [timeframe, setTimeframe] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

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
    onMutate: () => {
      toast({
        title: "🧠 Generating Prediction",
        description: "AI is analyzing your cost patterns...",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prediction/history"] });
      toast({
        title: "✅ Prediction Complete",
        description: "Cost forecast has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Prediction Failed",
        description: "Unable to generate cost prediction.",
        variant: "destructive",
      });
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
      toast({
        title: "✅ Analysis Complete",
        description: "New optimization suggestions available.",
      });
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Mock stats for display
  const stats = {
    currentSpend: 18450,
    predictedSpend: 24850,
    budget: 25000,
    previousMonth: 22300,
    potentialSavings: 9660,
    savingsOpportunities: 5,
    accuracy: 94
  };

  return (
    <>
      <Helmet>
        <title>Cost Prediction | InfraAudit</title>
        <meta name="description" content="AI-powered cloud cost prediction and optimization recommendations." />
      </Helmet>
    
      <div className="min-h-screen dashboard-grid-pattern p-4 md:p-6">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-purple-600/5 to-fuchsia-600/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-fuchsia-500/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative p-6 md:p-8 rounded-3xl border border-gray-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                      AI Cost Prediction
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Powered by machine learning • {stats.accuracy}% prediction accuracy
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <Select 
                  value={predictionModel} 
                  onValueChange={(value) => setPredictionModel(value as any)}
                >
                  <SelectTrigger className="w-[160px] bg-white/80 dark:bg-slate-800/80">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Linear
                      </span>
                    </SelectItem>
                    <SelectItem value="movingAverage">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Moving Avg
                      </span>
                    </SelectItem>
                    <SelectItem value="weightedMovingAverage">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Weighted
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={timeframe.toString()} 
                  onValueChange={(value) => setTimeframe(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] bg-white/80 dark:bg-slate-800/80">
                    <SelectValue placeholder="Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => generatePredictionMutation.mutate()}
                  disabled={generatePredictionMutation.isPending}
                  className={cn(
                    "gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600",
                    "hover:from-violet-700 hover:to-fuchsia-700",
                    "text-white shadow-lg"
                  )}
                >
                  {generatePredictionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Forecast
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 p-1.5 rounded-xl shadow-sm">
                <TabsTrigger 
                  value="overview"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="forecast"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Forecast
                </TabsTrigger>
                <TabsTrigger 
                  value="optimization"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimization
                </TabsTrigger>
                <TabsTrigger 
                  value="kubernetes"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Kubernetes
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    label: "Current Month", 
                    value: formatCurrency(stats.currentSpend),
                    icon: <DollarSign className="h-5 w-5" />,
                    change: "+12%",
                    trend: "up",
                    color: "blue"
                  },
                  { 
                    label: "Predicted Total", 
                    value: formatCurrency(stats.predictedSpend),
                    icon: <TrendingUp className="h-5 w-5" />,
                    change: "+11%",
                    trend: "up",
                    color: "violet"
                  },
                  { 
                    label: "Potential Savings", 
                    value: formatCurrency(stats.potentialSavings),
                    icon: <Sparkles className="h-5 w-5" />,
                    change: `${stats.savingsOpportunities} tips`,
                    trend: "down",
                    color: "emerald"
                  },
                  { 
                    label: "Budget Remaining", 
                    value: formatCurrency(stats.budget - stats.currentSpend),
                    icon: <Target className="h-5 w-5" />,
                    change: `${Math.round(((stats.budget - stats.currentSpend) / stats.budget) * 100)}%`,
                    trend: "stable",
                    color: "amber"
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "relative overflow-hidden border border-gray-200/60 dark:border-slate-800/60",
                      "bg-white/70 dark:bg-slate-900/50 backdrop-blur hover:shadow-lg transition-all"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className={cn(
                            "p-2.5 rounded-xl",
                            stat.color === "blue" && "bg-blue-500/10 text-blue-500",
                            stat.color === "violet" && "bg-violet-500/10 text-violet-500",
                            stat.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                            stat.color === "amber" && "bg-amber-500/10 text-amber-500"
                          )}>
                            {stat.icon}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              stat.trend === "up" && "text-red-500 border-red-500/30 bg-red-500/10",
                              stat.trend === "down" && "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
                              stat.trend === "stable" && "text-blue-500 border-blue-500/30 bg-blue-500/10"
                            )}
                          >
                            {stat.change}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PredictionGauge 
                  currentSpend={stats.currentSpend}
                  predictedSpend={stats.predictedSpend}
                  budget={stats.budget}
                  previousMonthSpend={stats.previousMonth}
                />
                <CostBreakdownChart />
              </div>

              {/* Forecast Chart */}
              <ForecastChart model={predictionModel} />

              {/* ROI Calculator CTA */}
              <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <Calculator className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Calculate Your ROI
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          See how much you could save with InfraAudit optimization recommendations
                        </p>
                      </div>
                    </div>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <a href="/roi-calculator">
                        <Rocket className="h-4 w-4" />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <ForecastChart model={predictionModel} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PredictionGauge 
                  currentSpend={stats.currentSpend}
                  predictedSpend={stats.predictedSpend}
                  budget={stats.budget}
                  previousMonthSpend={stats.previousMonth}
                />
                
                {/* Weekly Breakdown */}
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Weekly Forecast
                    </CardTitle>
                    <CardDescription>Predicted costs for the next 4 weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { week: "Week 1", amount: 5840, change: 8.2 },
                        { week: "Week 2", amount: 6120, change: 4.8 },
                        { week: "Week 3", amount: 6390, change: 4.4 },
                        { week: "Week 4", amount: 6500, change: 1.7 }
                      ].map((item, index) => (
                        <motion.div
                          key={item.week}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-semibold text-sm">
                              W{index + 1}
                            </div>
                            <span className="font-medium">{item.week}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.amount)}</p>
                            <p className={cn(
                              "text-xs",
                              item.change > 5 ? "text-red-500" : "text-amber-500"
                            )}>
                              +{item.change}% vs avg
                            </p>
                          </div>
                        </motion.div>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <SavingsOpportunities 
                onApply={(id) => {
                  toast({
                    title: "✅ Recommendation Applied",
                    description: "The optimization has been scheduled for implementation.",
                  });
                }}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CostBreakdownChart />
                
                {/* AI Insights */}
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      AI Insights
                    </CardTitle>
                    <CardDescription>Intelligent recommendations based on your usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        icon: <AlertTriangle className="h-4 w-4" />,
                        title: "Unusual Spending Pattern",
                        description: "EC2 costs increased 47% this week compared to average",
                        type: "warning"
                      },
                      {
                        icon: <CheckCircle2 className="h-4 w-4" />,
                        title: "Reserved Instance Opportunity",
                        description: "You could save $4,500/mo by switching to Reserved Instances",
                        type: "success"
                      },
                      {
                        icon: <Clock className="h-4 w-4" />,
                        title: "Idle Resources Detected",
                        description: "5 EC2 instances have <5% utilization over 14 days",
                        type: "info"
                      }
                    ].map((insight, index) => (
                      <motion.div
                        key={insight.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-4 rounded-xl border",
                          insight.type === "warning" && "bg-amber-500/10 border-amber-500/30",
                          insight.type === "success" && "bg-emerald-500/10 border-emerald-500/30",
                          insight.type === "info" && "bg-blue-500/10 border-blue-500/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            insight.type === "warning" && "bg-amber-500/20 text-amber-600",
                            insight.type === "success" && "bg-emerald-500/20 text-emerald-600",
                            insight.type === "info" && "bg-blue-500/20 text-blue-600"
                          )}>
                            {insight.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "kubernetes" && (
            <motion.div
              key="kubernetes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
