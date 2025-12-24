import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Shield, DollarSign, Cpu, Activity } from "lucide-react";

interface HealthMetric {
  name: string;
  score: number;
  previousScore?: number;
  icon: "security" | "cost" | "performance" | "availability";
  status: "excellent" | "good" | "warning" | "critical";
}

interface HealthScoreGaugeProps {
  overallScore: number;
  previousScore?: number;
  metrics?: HealthMetric[];
  isLoading?: boolean;
}

const defaultMetrics: HealthMetric[] = [
  { name: "Security", score: 87, previousScore: 82, icon: "security", status: "good" },
  { name: "Cost Efficiency", score: 72, previousScore: 75, icon: "cost", status: "warning" },
  { name: "Performance", score: 94, previousScore: 91, icon: "performance", status: "excellent" },
  { name: "Availability", score: 99, previousScore: 98, icon: "availability", status: "excellent" }
];

const getScoreColor = (score: number) => {
  if (score >= 90) return { stroke: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500" };
  if (score >= 75) return { stroke: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500" };
  if (score >= 50) return { stroke: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500" };
  return { stroke: "#ef4444", bg: "bg-red-500", text: "text-red-500" };
};

const getStatusBadge = (status: HealthMetric["status"]) => {
  switch (status) {
    case "excellent":
      return { label: "Excellent", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
    case "good":
      return { label: "Good", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" };
    case "warning":
      return { label: "Needs Attention", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" };
    case "critical":
      return { label: "Critical", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" };
  }
};

const getIcon = (type: HealthMetric["icon"]) => {
  const iconClass = "h-4 w-4";
  switch (type) {
    case "security":
      return <Shield className={iconClass} />;
    case "cost":
      return <DollarSign className={iconClass} />;
    case "performance":
      return <Cpu className={iconClass} />;
    case "availability":
      return <Activity className={iconClass} />;
  }
};

function CircularProgress({ score, size = 180, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated progress circle */}
        <motion.circle
          className="transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={colors.stroke}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${colors.stroke}40)`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={cn("text-4xl font-bold", colors.text)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Health Score
        </span>
      </div>
    </div>
  );
}

function MetricBar({ metric }: { metric: HealthMetric }) {
  const colors = getScoreColor(metric.score);
  const trend = metric.previousScore 
    ? metric.score > metric.previousScore 
      ? "up" 
      : metric.score < metric.previousScore 
        ? "down" 
        : "stable"
    : "stable";
  const change = metric.previousScore ? Math.abs(metric.score - metric.previousScore) : 0;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg transition-all duration-300",
            "bg-gray-100 dark:bg-gray-800 group-hover:scale-110",
            colors.text
          )}>
            {getIcon(metric.icon)}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {metric.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", colors.text)}>
            {metric.score}%
          </span>
          {trend !== "stable" && (
            <span className={cn(
              "flex items-center text-xs",
              trend === "up" ? "text-emerald-500" : "text-red-500"
            )}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="ml-0.5">{change}</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colors.bg)}
          initial={{ width: 0 }}
          animate={{ width: `${metric.score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{
            boxShadow: `0 0 10px ${colors.stroke}50`
          }}
        />
      </div>
    </div>
  );
}

export function HealthScoreGauge({ 
  overallScore = 88, 
  previousScore = 85, 
  metrics = defaultMetrics,
  isLoading = false 
}: HealthScoreGaugeProps) {
  const trend = previousScore 
    ? overallScore > previousScore 
      ? "up" 
      : overallScore < previousScore 
        ? "down" 
        : "stable"
    : "stable";
  const change = previousScore ? Math.abs(overallScore - previousScore) : 0;
  const overallStatus = getStatusBadge(
    overallScore >= 90 ? "excellent" : overallScore >= 75 ? "good" : overallScore >= 50 ? "warning" : "critical"
  );

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Infrastructure Health</CardTitle>
          <Badge variant="outline" className={overallStatus.className}>
            {overallStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Circular gauge */}
          <div className="flex flex-col items-center">
            <CircularProgress score={overallScore} />
            
            {/* Trend indicator */}
            <motion.div 
              className="flex items-center gap-1 mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {trend === "up" && (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500 font-medium">+{change} from last week</span>
                </>
              )}
              {trend === "down" && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">-{change} from last week</span>
                </>
              )}
              {trend === "stable" && (
                <>
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 font-medium">Stable</span>
                </>
              )}
            </motion.div>
          </div>
          
          {/* Metrics breakdown */}
          <div className="flex-1 w-full space-y-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.5 }}
              >
                <MetricBar metric={metric} />
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

