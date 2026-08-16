import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, subDays } from "date-fns";
import { AreaChart, BarChart3, ExternalLink, LineChart, Loader2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useCostExplorer } from "@/hooks/use-costs";
import type { CostChartType, DashboardWidget } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CostExplorerVisualization, formatCostMoney } from "@/components/cost/CostExplorerVisualization";

interface DashboardCostExplorerWidgetProps {
  widget: DashboardWidget;
  editing: boolean;
  onChange: (widget: DashboardWidget) => void;
}

export function DashboardCostExplorerWidget({ widget, editing, onChange }: DashboardCostExplorerWidgetProps) {
  const [, navigate] = useLocation();
  const config = widget.config ?? {};
  const [runtimeChartType, setRuntimeChartType] = useState<CostChartType>(config.chartType ?? "area");
  useEffect(() => setRuntimeChartType(config.chartType ?? "area"), [config.chartType]);
  const timeframe = config.timeframe ?? "30d";
  const today = new Date();
  const start = timeframe === "current_month" ? startOfMonth(today) : subDays(today, timeframe === "7d" ? 6 : timeframe === "90d" ? 89 : 29);
  const filters = useMemo(() => ({
    provider: config.provider && config.provider !== "all" ? config.provider : undefined,
    accountId: config.accountId || undefined,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(today, "yyyy-MM-dd"),
    granularity: "daily" as const,
    groupBy: config.groupBy ?? "service" as const,
    limit: 10,
    offset: 0,
  }), [config.accountId, config.groupBy, config.provider, timeframe]);
  const query = useCostExplorer(filters);
  const result = query.data;

  const updateConfig = (change: Partial<NonNullable<DashboardWidget["config"]>>) => {
    onChange({ ...widget, config: { ...config, ...change } });
  };

  return (
    <div className="ia-card h-full" style={{ display: "flex", flexDirection: "column" }}>
      <div className="ia-card-head flex-wrap">
        <div className="ia-card-title"><TrendingUp size={15} /> {widget.title || "Cost Explorer"} <span className="ia-eyebrow">actual spend</span></div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate("/billing-explorer")}>Explore <ExternalLink className="ml-1 h-3 w-3" /></Button>
      </div>
      {editing && (
        <div className="grid gap-2 border-b p-3 sm:grid-cols-3">
          <Select value={config.timeframe ?? "30d"} onValueChange={(value) => updateConfig({ timeframe: value as NonNullable<typeof config.timeframe> })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="current_month">Current month</SelectItem></SelectContent></Select>
          <Select value={config.groupBy ?? "service"} onValueChange={(value) => updateConfig({ groupBy: value as NonNullable<typeof config.groupBy> })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service">By service</SelectItem><SelectItem value="region">By region</SelectItem><SelectItem value="resource">By resource</SelectItem></SelectContent></Select>
          <Select value={config.provider ?? "all"} onValueChange={(value) => updateConfig({ provider: value as NonNullable<typeof config.provider> })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All providers</SelectItem><SelectItem value="aws">AWS</SelectItem><SelectItem value="gcp">GCP</SelectItem><SelectItem value="azure">Azure</SelectItem></SelectContent></Select>
        </div>
      )}
      <div className="ia-card-pad flex-1">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div><div className="text-[11px] text-muted-foreground">Visible period total</div><div className="text-2xl font-bold tabular-nums">{query.isLoading ? "—" : formatCostMoney(result?.totalCost ?? 0, result?.currency)}</div></div>
          <div className="flex rounded-md border bg-muted/40 p-0.5">
            {([[
              "area", AreaChart, "Area",
            ], ["line", LineChart, "Line"], ["bar", BarChart3, "Bars"]] as const).map(([value, Icon, label]) => (
              <Button key={value} variant={runtimeChartType === value ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => { setRuntimeChartType(value); if (editing) updateConfig({ chartType: value }); }} title={`${label} chart`}><Icon className="h-3.5 w-3.5" /><span className="sr-only">{label}</span></Button>
            ))}
          </div>
        </div>
        {query.isLoading ? <div className="flex h-[210px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <CostExplorerVisualization series={result?.series ?? []} breakdown={result?.breakdown ?? []} currency={result?.currency} granularity="daily" chartType={runtimeChartType} height={210} />
        )}
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{result?.totalBreakdownRows ?? 0} {config.groupBy ?? "service"} dimensions</span><span>{result?.latestCostDate ? `through ${result.latestCostDate}` : "awaiting cost evidence"}</span></div>
      </div>
    </div>
  );
}
