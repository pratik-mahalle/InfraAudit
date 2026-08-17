import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, subDays } from "date-fns";
import { AreaChart, BarChart3, ExternalLink, LineChart, Loader2, PieChart, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useCostExplorer } from "@/hooks/use-costs";
import type { CostBreakdownChartType, CostChartType, CostVisualizationMode, DashboardWidget } from "@/types";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
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
  const [runtimeMode, setRuntimeMode] = useState<CostVisualizationMode>(config.visualizationMode ?? "trend");
  const [runtimeBreakdownChartType, setRuntimeBreakdownChartType] = useState<CostBreakdownChartType>(config.breakdownChartType ?? "bar");
  useEffect(() => setRuntimeChartType(config.chartType ?? "area"), [config.chartType]);
  useEffect(() => setRuntimeMode(config.visualizationMode ?? "trend"), [config.visualizationMode]);
  useEffect(() => setRuntimeBreakdownChartType(config.breakdownChartType ?? "bar"), [config.breakdownChartType]);
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
        <Button text size="small" className="h-7 px-2 text-xs" onClick={() => navigate("/billing-explorer")}>Explore <ExternalLink className="ml-1 h-3 w-3" /></Button>
      </div>
      {editing && (
        <div className="grid gap-2 border-b p-3 sm:grid-cols-3">
          <Dropdown value={config.timeframe ?? "30d"} onChange={(event) => updateConfig({ timeframe: event.value as NonNullable<typeof config.timeframe> })} options={[{ label: "Last 7 days", value: "7d" }, { label: "Last 30 days", value: "30d" }, { label: "Last 90 days", value: "90d" }, { label: "Current month", value: "current_month" }]} className="w-full" />
          <Dropdown value={config.groupBy ?? "service"} onChange={(event) => updateConfig({ groupBy: event.value as NonNullable<typeof config.groupBy> })} options={[{ label: "By service", value: "service" }, { label: "By region", value: "region" }, { label: "By resource", value: "resource" }]} className="w-full" />
          <Dropdown value={config.provider ?? "all"} onChange={(event) => updateConfig({ provider: event.value as NonNullable<typeof config.provider> })} options={[{ label: "All providers", value: "all" }, { label: "AWS", value: "aws" }, { label: "GCP", value: "gcp" }, { label: "Azure", value: "azure" }]} className="w-full" />
        </div>
      )}
      <div className="ia-card-pad flex-1">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div><div className="text-[11px] text-muted-foreground">Visible period total</div><div className="text-2xl font-bold tabular-nums">{query.isLoading ? "—" : formatCostMoney(result?.totalCost ?? 0, result?.currency)}</div></div>
          <div className="flex flex-wrap justify-end gap-2">
            <div className="flex rounded-md border bg-muted/40 p-0.5">
              {(["trend", "breakdown"] as const).map((value) => (
                  <Button key={value} severity={runtimeMode === value ? "secondary" : "contrast"} text={runtimeMode !== value} size="small" className="h-7 px-2 text-[11px] capitalize" onClick={() => { setRuntimeMode(value); if (editing) updateConfig({ visualizationMode: value }); }}>{value}</Button>
              ))}
            </div>
            <div className="flex rounded-md border bg-muted/40 p-0.5">
              {runtimeMode === "trend" ? ([[
                "area", AreaChart, "Area",
              ], ["line", LineChart, "Line"], ["bar", BarChart3, "Bars"]] as const).map(([value, Icon, label]) => (
                <Button key={value} severity={runtimeChartType === value ? "secondary" : "contrast"} text={runtimeChartType !== value} size="small" className="h-7 px-2" onClick={() => { setRuntimeChartType(value); if (editing) updateConfig({ chartType: value }); }} title={`${label} chart`}><Icon className="h-3.5 w-3.5" /><span className="sr-only">{label}</span></Button>
              )) : ([
                ["bar", BarChart3, "Horizontal bars"],
                ["donut", PieChart, "Donut"],
              ] as const).map(([value, Icon, label]) => (
                <Button key={value} severity={runtimeBreakdownChartType === value ? "secondary" : "contrast"} text={runtimeBreakdownChartType !== value} size="small" className="h-7 px-2" onClick={() => { setRuntimeBreakdownChartType(value); if (editing) updateConfig({ breakdownChartType: value }); }} title={`${label} chart`}><Icon className="h-3.5 w-3.5" /><span className="sr-only">{label}</span></Button>
              ))}
            </div>
          </div>
        </div>
        {query.isLoading ? <div className="flex h-[210px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <CostExplorerVisualization series={result?.series ?? []} breakdown={result?.breakdown ?? []} currency={result?.currency} granularity="daily" chartType={runtimeChartType} mode={runtimeMode} breakdownChartType={runtimeBreakdownChartType} height={210} />
        )}
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{result?.totalBreakdownRows ?? 0} {config.groupBy ?? "service"} dimensions</span><span>{result?.latestCostDate ? `through ${result.latestCostDate}` : "awaiting cost evidence"}</span></div>
      </div>
    </div>
  );
}
