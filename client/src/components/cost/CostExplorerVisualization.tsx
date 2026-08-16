import { useId, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CostChartType, CostExplorerBreakdown, CostExplorerSeriesPoint } from "@/types";

export type CostVisualizationMode = "trend" | "breakdown";

interface CostExplorerVisualizationProps {
  series: CostExplorerSeriesPoint[];
  breakdown?: CostExplorerBreakdown[];
  currency?: string;
  granularity: "daily" | "monthly";
  chartType: CostChartType;
  mode?: CostVisualizationMode;
  height?: number;
  emptyMessage?: string;
}

export function formatCostMoney(value: number, currency = "USD") {
  if (currency === "MIX") return `${value.toFixed(2)} mixed currency`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function CostExplorerVisualization({
  series,
  breakdown = [],
  currency = "USD",
  granularity,
  chartType,
  mode = "trend",
  height = 288,
  emptyMessage = "No cost history matches this scope.",
}: CostExplorerVisualizationProps) {
  const gradientId = `cost-fill-${useId().replaceAll(":", "")}`;
  const trendData = useMemo(() => series.map((point) => ({
    period: format(parseISO(point.period), granularity === "monthly" ? "MMM yyyy" : "MMM d"),
    cost: point.cost,
  })), [series, granularity]);
  const breakdownData = useMemo(() => breakdown.slice(0, 10).map((item) => ({
    label: item.key.length > 34 ? `${item.key.slice(0, 31)}…` : item.key,
    fullLabel: item.key,
    cost: item.cost,
  })), [breakdown]);

  const tooltipFormatter = (value: number | string) => formatCostMoney(Number(value), currency);
  const axisFormatter = (value: number) => new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  if (mode === "breakdown") {
    if (breakdownData.length === 0) {
      return <EmptyChart height={height} message="No grouped cost rows match this scope." />;
    }
    return (
      <div style={{ height }} role="img" aria-label="Cost breakdown bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdownData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" tickFormatter={axisFormatter} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
              formatter={tooltipFormatter}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
              contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))", background: "hsl(var(--popover))" }}
            />
            <Bar dataKey="cost" fill="#3b82f6" radius={[0, 5, 5, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (trendData.length === 0) {
    return <EmptyChart height={height} message={emptyMessage} />;
  }

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
      <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
      <YAxis tickFormatter={axisFormatter} tick={{ fontSize: 11 }} width={56} axisLine={false} tickLine={false} />
      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))", background: "hsl(var(--popover))" }} />
    </>
  );

  return (
    <div style={{ height }} role="img" aria-label={`${chartType} chart of cost over time`}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            {common}
            <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        ) : chartType === "line" ? (
          <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            {common}
            <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        ) : (
          <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            {common}
            <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill={`url(#${gradientId})`} strokeWidth={2.5} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ height, message }: { height: number; message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
      {message}
    </div>
  );
}
