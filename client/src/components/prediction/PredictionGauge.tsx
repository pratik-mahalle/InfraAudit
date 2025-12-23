import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target } from "lucide-react";

interface PredictionGaugeProps {
  currentSpend: number;
  predictedSpend: number;
  budget: number;
  previousMonthSpend?: number;
  isLoading?: boolean;
}

export function PredictionGauge({
  currentSpend = 18450,
  predictedSpend = 24850,
  budget = 25000,
  previousMonthSpend = 22300,
  isLoading = false
}: PredictionGaugeProps) {
  const percentUsed = Math.min((predictedSpend / budget) * 100, 100);
  const percentChange = previousMonthSpend 
    ? ((predictedSpend - previousMonthSpend) / previousMonthSpend) * 100 
    : 0;
  const isOverBudget = predictedSpend > budget;
  const isNearBudget = percentUsed >= 85 && !isOverBudget;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate arc path
  const radius = 85;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Half circle
  const offset = circumference - (percentUsed / 100) * circumference;

  // Get status color
  const getStatusColor = () => {
    if (isOverBudget) return { stroke: "#ef4444", bg: "bg-red-500", text: "text-red-500" };
    if (isNearBudget) return { stroke: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500" };
    return { stroke: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500" };
  };

  const statusColor = getStatusColor();

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Budget Forecast
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              isOverBudget 
                ? "bg-red-500/10 text-red-600 border-red-500/30" 
                : isNearBudget 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
            )}
          >
            {isOverBudget ? "Over Budget" : isNearBudget ? "Near Limit" : "On Track"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Semi-circular gauge */}
          <div className="relative" style={{ width: radius * 2, height: radius + 20 }}>
            <svg 
              width={radius * 2} 
              height={radius + 20} 
              className="transform -rotate-180"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background arc */}
              <path
                d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-gray-700"
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <motion.path
                d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
                fill="none"
                stroke={statusColor.stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: percentUsed / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 6px ${statusColor.stroke}50)`
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <motion.span 
                className={cn("text-3xl font-bold", statusColor.text)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {formatCurrency(predictedSpend)}
              </motion.span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                of {formatCurrency(budget)} budget
              </span>
            </div>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-4 border-t border-gray-200/60 dark:border-slate-700/60">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(currentSpend)}
              </p>
            </div>
            <div className="text-center border-x border-gray-200/60 dark:border-slate-700/60">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Predicted</p>
              <p className={cn("text-lg font-semibold", statusColor.text)}>
                {formatCurrency(predictedSpend)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">vs Last Month</p>
              <p className={cn(
                "text-lg font-semibold flex items-center justify-center gap-1",
                percentChange > 0 ? "text-red-500" : "text-emerald-500"
              )}>
                {percentChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(percentChange).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Alert message */}
          {(isOverBudget || isNearBudget) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={cn(
                "mt-4 p-3 rounded-lg flex items-start gap-2 text-sm w-full",
                isOverBudget 
                  ? "bg-red-500/10 text-red-700 dark:text-red-400" 
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {isOverBudget 
                  ? `Projected to exceed budget by ${formatCurrency(predictedSpend - budget)}`
                  : `${(100 - percentUsed).toFixed(1)}% of budget remaining - consider reviewing expenses`
                }
              </span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

