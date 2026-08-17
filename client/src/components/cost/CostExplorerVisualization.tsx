import { useId, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CostBreakdownChartType, CostChartType, CostExplorerBreakdown, CostExplorerSeriesPoint, CostVisualizationMode } from "@/types";

export type { CostVisualizationMode } from "@/types";

const BREAKDOWN_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ec4899", "#6366f1", "#84cc16", "#14b8a6"];

interface CostExplorerVisualizationProps {
  series: CostExplorerSeriesPoint[];
  breakdown?: CostExplorerBreakdown[];
  currency?: string;
  granularity: "daily" | "monthly";
  chartType: CostChartType;
  mode?: CostVisualizationMode;
  breakdownChartType?: CostBreakdownChartType;
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
  breakdownChartType = "bar",
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
    if (breakdownChartType === "donut") {
      const breakdownTotal = breakdownData.reduce((sum, item) => sum + item.cost, 0);
      return (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(170px,0.7fr)]" style={{ minHeight: height }}>
          <div className="relative" style={{ height }} role="img" aria-label="Cost breakdown donut chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdownData} dataKey="cost" nameKey="fullLabel" cx="50%" cy="50%" innerRadius="54%" outerRadius="80%" paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                  {breakdownData.map((item, index) => <Cell key={item.fullLabel} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))", background: "hsl(var(--popover))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted-foreground">Top groups</span>
              <strong className="max-w-[120px] truncate text-base tabular-nums">{formatCostMoney(breakdownTotal, currency)}</strong>
            </div>
          </div>
          <div className="flex max-h-[288px] flex-col justify-center gap-2 overflow-y-auto py-3">
            {breakdownData.map((item, index) => (
              <div key={item.fullLabel} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length] }} />
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={item.fullLabel}>{item.fullLabel}</span>
                <span className="shrink-0 font-medium tabular-nums">{formatCostMoney(item.cost, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      );
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
