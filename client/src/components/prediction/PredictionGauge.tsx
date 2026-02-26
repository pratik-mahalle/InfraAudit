import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PredictionGaugeProps {
  currentSpend: number;
  predictedSpend: number;
  budget: number;
  previousMonthSpend?: number;
  isLoading?: boolean;
}

export function PredictionGauge({
  currentSpend = 0,
  predictedSpend = 0,
  budget = 0,
  previousMonthSpend = 0,
}: PredictionGaugeProps) {
  const percentUsed = budget > 0 ? Math.min((currentSpend / budget) * 100, 100) : 0;
  const percentPredicted = budget > 0 ? Math.min((predictedSpend / budget) * 100, 120) : 0;
  const percentChange = previousMonthSpend
    ? ((predictedSpend - previousMonthSpend) / previousMonthSpend) * 100
    : 0;
  const isOverBudget = predictedSpend > budget;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusColor = () => {
    if (isOverBudget) return "red";
    if (percentPredicted >= 85) return "amber";
    return "emerald";
  };
  const status = getStatusColor();

  const barColorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  const textColorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
  };
  const bgColorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    red: "bg-red-500/10",
  };

  const statusLabel = isOverBudget
    ? "Over Budget"
    : percentPredicted >= 85
      ? "Near Limit"
      : "On Track";

  return (
    <Card className="rounded-xl shadow-none border-border/50">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-foreground">
            Budget Forecast
          </h3>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              bgColorMap[status],
              textColorMap[status]
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Main Amount */}
        <div>
          <p className="text-4xl font-semibold tracking-tight text-foreground">
            {formatCurrency(currentSpend)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {formatCurrency(budget)} budget
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Spent</span>
            <span>{percentUsed.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                barColorMap[status]
              )}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          {/* Predicted marker */}
          {predictedSpend > 0 && budget > 0 && (
            <div className="relative w-full h-0">
              <div
                className="absolute -top-3.5 flex flex-col items-center"
                style={{
                  left: `${Math.min(percentPredicted, 100)}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className={cn(
                    "w-0.5 h-2",
                    barColorMap[status],
                    "opacity-60"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium mt-0.5 whitespace-nowrap",
                    textColorMap[status]
                  )}
                >
                  Predicted
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(currentSpend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Predicted</p>
            <p
              className={cn(
                "text-lg font-semibold tabular-nums",
                textColorMap[status]
              )}
            >
              {formatCurrency(predictedSpend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">vs Last Month</p>
            <div className="flex items-center gap-1">
              {percentChange > 0.5 ? (
                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              ) : percentChange < -0.5 ? (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  percentChange > 0.5
                    ? "text-red-500"
                    : percentChange < -0.5
                      ? "text-emerald-500"
                      : "text-muted-foreground"
                )}
              >
                {Math.abs(percentChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Alert */}
        {isOverBudget && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
            Projected to exceed budget by{" "}
            <span className="font-semibold">
              {formatCurrency(predictedSpend - budget)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
