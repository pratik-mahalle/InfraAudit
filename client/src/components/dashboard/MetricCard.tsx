import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  DollarSign,
  Server,
  Bell,
  Zap,
  Activity,
  Cloud,
  Lock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MetricType = "security" | "cost" | "resources" | "alerts" | "performance" | "availability";
type TrendType = "up" | "down" | "stable";
type StatusType = "excellent" | "good" | "warning" | "critical";

interface SparklineData {
  value: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  type: MetricType;
  trend?: TrendType;
  trendValue?: number;
  status?: StatusType;
  sparklineData?: SparklineData[];
  isLoading?: boolean;
  onClick?: () => void;
}

const getIcon = (type: MetricType) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "security":
      return <Shield className={iconClass} />;
    case "cost":
      return <DollarSign className={iconClass} />;
    case "resources":
      return <Server className={iconClass} />;
    case "alerts":
      return <Bell className={iconClass} />;
    case "performance":
      return <Zap className={iconClass} />;
    case "availability":
      return <Activity className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
};

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case "excellent":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        border: "border-emerald-500/20",
        icon: "text-emerald-500",
        glow: "shadow-emerald-500/20"
      };
    case "good":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        border: "border-blue-500/20",
        icon: "text-blue-500",
        glow: "shadow-blue-500/20"
      };
    case "warning":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        border: "border-amber-500/20",
        icon: "text-amber-500",
        glow: "shadow-amber-500/20"
      };
    case "critical":
      return {
        bg: "bg-red-500/10 dark:bg-red-500/20",
        border: "border-red-500/20",
        icon: "text-red-500",
        glow: "shadow-red-500/20"
      };
  }
};

const getTrendIcon = (trend: TrendType) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3.5 w-3.5" />;
    case "down":
      return <TrendingDown className="h-3.5 w-3.5" />;
    default:
      return <Minus className="h-3.5 w-3.5" />;
  }
};

// Simple sparkline component
function Sparkline({ data, color }: { data: SparklineData[]; color: string }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none" 
      className="w-full h-full"
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <motion.polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#sparkline-gradient-${color})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

// Generate sample sparkline data
const generateSparklineData = (trend: TrendType = "up"): SparklineData[] => {
  const data: SparklineData[] = [];
  let value = 50 + Math.random() * 20;
  
  for (let i = 0; i < 12; i++) {
    const change = (Math.random() - 0.5) * 10;
    const trendBias = trend === "up" ? 2 : trend === "down" ? -2 : 0;
    value = Math.max(10, Math.min(90, value + change + trendBias));
    data.push({ value });
  }
  
  return data;
};

export function MetricCard({
  title,
  value,
  subtitle,
  type,
  trend = "stable",
  trendValue = 0,
  status = "good",
  sparklineData,
  isLoading = false,
  onClick
}: MetricCardProps) {
  const config = getStatusConfig(status);
  const data = sparklineData || generateSparklineData(trend);
  
  const sparklineColor = status === "excellent" || status === "good" 
    ? "#10b981" 
    : status === "warning" 
      ? "#f59e0b" 
      : "#ef4444";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300",
              "bg-white dark:bg-slate-900/80 backdrop-blur",
              "border border-gray-200/60 dark:border-slate-800/60",
              "hover:shadow-xl",
              config.glow
            )}
          >
            {/* Background sparkline */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute bottom-0 left-0 right-0 h-16">
                <Sparkline data={data} color={sparklineColor} />
              </div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  config.bg,
                  config.border,
                  "border"
                )}>
                  <span className={config.icon}>
                    {getIcon(type)}
                  </span>
                </div>
                
                {/* Trend indicator */}
                {!isLoading && trendValue !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    trend === "up" && type !== "cost" && type !== "alerts"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : trend === "down" && (type === "cost" || type === "alerts")
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}>
                    {getTrendIcon(trend)}
                    <span>{Math.abs(trendValue)}%</span>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {value}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {subtitle}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to view {title.toLowerCase()} details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

