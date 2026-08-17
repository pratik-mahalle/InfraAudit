import { useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { useLocation } from "wouter";
import {
  AlertCircle,
  AreaChart as AreaChartIcon,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Database,
  Download,
  Info,
  LineChart as LineChartIcon,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCostAccounts, useCostExplorer } from "@/hooks/use-costs";
import type { CostBreakdownChartType, CostChartType, CostExplorerBreakdown, CostExplorerFilters } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostMonitorWidget } from "@/components/cost/CostMonitorWidget";
import { CostExplorerVisualization, formatCostMoney, type CostVisualizationMode } from "@/components/cost/CostExplorerVisualization";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 20;

function money(value: number, currency = "USD") {
  if (currency === "MIX") return `${value.toFixed(2)} mixed currency`;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function BillingExplorer() {
  const [, navigate] = useLocation();
  const today = format(new Date(), "yyyy-MM-dd");
  const [provider, setProvider] = useState("aws");
  const [accountId, setAccountId] = useState("all");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(today);
  const [granularity, setGranularity] = useState<"daily" | "monthly">("daily");
  const [groupBy, setGroupBy] = useState<"service" | "region" | "resource">("service");
  const [service, setService] = useState("");
  const [region, setRegion] = useState("");
  const [page, setPage] = useState(0);
  const [chartType, setChartType] = useState<CostChartType>("area");
  const [breakdownChartType, setBreakdownChartType] = useState<CostBreakdownChartType>("bar");
  const [visualizationMode, setVisualizationMode] = useState<CostVisualizationMode>("trend");
  const [selectedBreakdown, setSelectedBreakdown] = useState<CostExplorerBreakdown | null>(null);

  const accountsQuery = useCostAccounts();
  const accounts = accountsQuery.data?.accounts ?? [];
  const visibleAccounts = accounts.filter((account) => provider === "all" || account.provider === provider);
  const selectedAccountProvider = accountId === "all"
    ? undefined
    : accounts.find((account) => account.cloudAccountId === accountId)?.provider;
  const filters: CostExplorerFilters = {
    provider: provider === "all" ? undefined : provider,
    accountId: accountId === "all" ? undefined : accountId,
    service: service.trim() || undefined,
    region: region.trim() || undefined,
    startDate,
    endDate,
    granularity,
    groupBy,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
  const explorerQuery = useCostExplorer(filters);
  const result = explorerQuery.data;
  const detailGroupBy: CostExplorerFilters["groupBy"] = groupBy === "service" ? "region" : "service";
  const detailFilters: CostExplorerFilters = {
    provider: selectedBreakdown?.provider,
    accountId: selectedBreakdown?.cloudAccountId,
    service: groupBy === "service" ? selectedBreakdown?.key : service.trim() || undefined,
    region: groupBy === "region" ? selectedBreakdown?.key : region.trim() || undefined,
    startDate,
    endDate,
    granularity,
    groupBy: detailGroupBy,
    limit: 10,
    offset: 0,
  };
  const detailQuery = useCostExplorer(detailFilters, Boolean(selectedBreakdown) && groupBy !== "resource");
  const detail = detailQuery.data;
  const totalPages = Math.max(1, Math.ceil((result?.totalBreakdownRows ?? 0) / PAGE_SIZE));
  const selectedDayDifference = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
  const selectedDays = Number.isFinite(selectedDayDifference) ? Math.max(1, selectedDayDifference + 1) : 1;
  const averageDailyCost = (result?.totalCost ?? 0) / selectedDays;
  const isStale = result?.latestCostDate
    ? Date.now() - parseISO(result.latestCostDate).getTime() > 72 * 60 * 60 * 1000
    : false;

  const exportCSV = () => {
    if (!result) return;
    const rows = [
      ["dimension", "provider", "cloud_account_id", "cost", "currency"],
      ...result.breakdown.map((item) => [item.key, item.provider, item.cloudAccountId, item.cost, item.currency]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `infraudit-costs-${startDate}-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetPage = () => setPage(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing Explorer</h1>
            <p className="text-muted-foreground">Investigate imported provider charges by account, date, service, region, or resource.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => explorerQuery.refetch()} disabled={explorerQuery.isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${explorerQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!result?.breakdown.length}>
              <Download className="mr-2 h-4 w-4" /> Export page
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How to read this view</AlertTitle>
          <AlertDescription>
            Selected-period and comparison totals come from stored provider billing evidence. The previous period is the immediately preceding window of equal length; forecasts and optimization savings are intentionally excluded from these actual-cost totals.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing scope</CardTitle>
            <CardDescription>Historical accounts remain separate after a provider connection changes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(value) => { setProvider(value); setAccountId("all"); resetPage(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="gcp">GCP</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cloud account</Label>
              <Select value={accountId} onValueChange={(value) => { setAccountId(value); resetPage(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {visibleAccounts.map((account) => (
                    <SelectItem key={`${account.provider}:${account.cloudAccountId}`} value={account.cloudAccountId}>
                      {account.cloudAccountId} · {account.connected ? "connected" : "historical"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} max={endDate} onChange={(event) => { setStartDate(event.target.value); resetPage(); }} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" value={endDate} min={startDate} max={today} onChange={(event) => { setEndDate(event.target.value); resetPage(); }} />
            </div>
            <div className="space-y-2">
              <Label>Time grain</Label>
              <Select value={granularity} onValueChange={(value: "daily" | "monthly") => setGranularity(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Break down by</Label>
              <Select value={groupBy} onValueChange={(value: "service" | "region" | "resource") => { setGroupBy(value); resetPage(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="service">Service</SelectItem><SelectItem value="region">Region</SelectItem><SelectItem value="resource">Resource</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service filter</Label>
              <Input value={service} placeholder="Exact service name" onChange={(event) => { setService(event.target.value); resetPage(); }} />
            </div>
            <div className="space-y-2">
              <Label>Region filter</Label>
              <Input value={region} placeholder="e.g. us-east-1" onChange={(event) => { setRegion(event.target.value); resetPage(); }} />
            </div>
          </CardContent>
        </Card>

        {groupBy === "resource" && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Resource attribution depends on provider coverage</AlertTitle>
            <AlertDescription>AWS resource-level Cost Explorer data is imported for the available recent window; unattributed aggregate costs are intentionally not mixed into this view.</AlertDescription>
          </Alert>
        )}

        {explorerQuery.isError && (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Billing history could not be loaded</AlertTitle><AlertDescription>{explorerQuery.error instanceof Error ? explorerQuery.error.message : "Try again."}</AlertDescription></Alert>
        )}

        {isStale && (
          <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Imported history is stale</AlertTitle><AlertDescription>The latest cost date is {result?.latestCostDate ? format(parseISO(result.latestCostDate), "PPP") : "unknown"}. Sync costs before making a current-period decision.</AlertDescription></Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardDescription>Selected period</CardDescription><CardTitle>{explorerQuery.isLoading ? "—" : money(result?.totalCost ?? 0, result?.currency)}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{startDate} through {endDate}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Previous equal period</CardDescription><CardTitle>{explorerQuery.isLoading ? "—" : money(result?.previousTotalCost ?? 0, result?.currency)}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Comparable window immediately before selection</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Period change</CardDescription><CardTitle className="flex items-center gap-2">{(result?.changePercent ?? 0) > 0 ? <ArrowUpRight className="h-5 w-5 text-red-500" /> : (result?.changePercent ?? 0) < 0 ? <ArrowDownRight className="h-5 w-5 text-emerald-500" /> : null}{explorerQuery.isLoading ? "—" : `${Math.abs(result?.changePercent ?? 0).toFixed(1)}%`}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Cost basis: {result?.costBasis ?? "unknown"}{result?.isEstimated ? " · provider estimated" : " · provider actual"}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Average per selected day</CardDescription><CardTitle>{explorerQuery.isLoading ? "—" : money(averageDailyCost, result?.currency)}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Selected total divided by {selectedDays} calendar day{selectedDays === 1 ? "" : "s"}</CardContent></Card>
        </div>

        <CostMonitorWidget
          layout="wide"
          provider={provider === "all" ? selectedAccountProvider : provider}
          accountId={accountId === "all" ? undefined : accountId}
        />

        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" /> Cost visualization</CardTitle>
              <CardDescription>{result?.lastUpdatedAt ? `Imported ${format(parseISO(result.lastUpdatedAt), "PPp")}` : "No import timestamp available"}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={visualizationMode} onValueChange={(value) => setVisualizationMode(value as CostVisualizationMode)}>
                <TabsList className="h-9"><TabsTrigger value="trend">Over time</TabsTrigger><TabsTrigger value="breakdown">Top {groupBy}</TabsTrigger></TabsList>
              </Tabs>
              {visualizationMode === "trend" && (
                <div className="flex rounded-md border bg-muted/40 p-0.5" aria-label="Chart type">
                  {([
                    ["area", AreaChartIcon, "Area"],
                    ["line", LineChartIcon, "Line"],
                    ["bar", BarChart3, "Bars"],
                  ] as const).map(([value, Icon, label]) => (
                    <Button key={value} type="button" size="sm" variant={chartType === value ? "secondary" : "ghost"} className="h-8 px-2.5" onClick={() => setChartType(value)} aria-pressed={chartType === value} title={`${label} chart`}>
                      <Icon className="h-4 w-4" /><span className="sr-only">{label} chart</span>
                    </Button>
                  ))}
                </div>
              )}
              {visualizationMode === "breakdown" && (
                <div className="flex rounded-md border bg-muted/40 p-0.5" aria-label="Breakdown chart type">
                  {([[
                    "bar", BarChart3, "Horizontal bars",
                  ], ["donut", PieChartIcon, "Donut"]] as const).map(([value, Icon, label]) => (
                    <Button key={value} type="button" size="sm" variant={breakdownChartType === value ? "secondary" : "ghost"} className="h-8 px-2.5" onClick={() => setBreakdownChartType(value)} aria-pressed={breakdownChartType === value} title={`${label} chart`}>
                      <Icon className="h-4 w-4" /><span className="sr-only">{label} chart</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {explorerQuery.isLoading ? <div className="flex h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <CostExplorerVisualization
                series={result?.series ?? []}
                breakdown={result?.breakdown ?? []}
                currency={result?.currency}
                granularity={granularity}
                chartType={chartType}
                mode={visualizationMode}
                breakdownChartType={breakdownChartType}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base capitalize">Cost by {groupBy}</CardTitle><CardDescription>{result?.totalBreakdownRows ?? 0} billing dimensions in the selected scope.</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table><TableHeader><TableRow><TableHead className="capitalize">{groupBy}</TableHead><TableHead>Provider</TableHead><TableHead>Cloud account</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader><TableBody>
                {(result?.breakdown ?? []).map((item) => (
                  <TableRow
                    key={`${item.provider}:${item.cloudAccountId}:${item.key}`}
                    className={groupBy === "resource" ? "" : "cursor-pointer hover:bg-muted/60"}
                    tabIndex={groupBy === "resource" ? undefined : 0}
                    role={groupBy === "resource" ? undefined : "button"}
                    aria-label={groupBy === "resource" ? undefined : `Open details for ${item.key}`}
                    onClick={() => groupBy !== "resource" && setSelectedBreakdown(item)}
                    onKeyDown={(event) => {
                      if (groupBy !== "resource" && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        setSelectedBreakdown(item);
                      }
                    }}
                  >
                    <TableCell className="font-medium"><span className="flex items-center justify-between gap-2">{item.key}{groupBy !== "resource" && <ChevronRight className="h-4 w-4 text-muted-foreground" />}</span></TableCell>
                    <TableCell><Badge variant="outline" className="uppercase">{item.provider}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{item.cloudAccountId}</TableCell>
                    <TableCell className="text-right font-medium">{money(item.cost, item.currency)}</TableCell>
                  </TableRow>
                ))}
                {!explorerQuery.isLoading && !result?.breakdown.length && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No detailed billing rows found.</TableCell></TableRow>}
              </TableBody></Table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>Page {page + 1} of {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</Button><Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedBreakdown)} onOpenChange={(open) => !open && setSelectedBreakdown(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="pr-8">
            <div className="flex items-center gap-2"><Badge variant="outline" className="uppercase">{selectedBreakdown?.provider}</Badge><span className="text-xs text-muted-foreground">{selectedBreakdown?.cloudAccountId}</span></div>
            <SheetTitle>{selectedBreakdown?.key}</SheetTitle>
            <SheetDescription>
              {groupBy === "service" ? "Service" : "Region"} evidence for {startDate} through {endDate}, compared with the immediately preceding equal period.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><CardHeader className="p-4 pb-2"><CardDescription>Selected cost</CardDescription><CardTitle className="text-xl">{formatCostMoney(detail?.totalCost ?? selectedBreakdown?.cost ?? 0, detail?.currency ?? selectedBreakdown?.currency)}</CardTitle></CardHeader></Card>
              <Card><CardHeader className="p-4 pb-2"><CardDescription>Previous period</CardDescription><CardTitle className="text-xl">{detailQuery.isFetching ? "—" : formatCostMoney(detail?.previousTotalCost ?? 0, detail?.currency ?? selectedBreakdown?.currency)}</CardTitle></CardHeader></Card>
              <Card><CardHeader className="p-4 pb-2"><CardDescription>Period change</CardDescription><CardTitle className="text-xl">{detailQuery.isFetching ? "—" : `${detail?.changePercent && detail.changePercent > 0 ? "+" : ""}${(detail?.changePercent ?? 0).toFixed(1)}%`}</CardTitle></CardHeader></Card>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Cost over time</h3><span className="text-xs text-muted-foreground">{detail?.costBasis ?? result?.costBasis ?? "provider evidence"}</span></div>
              {detailQuery.isFetching ? <div className="flex h-56 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
                <CostExplorerVisualization series={detail?.series ?? []} currency={detail?.currency ?? selectedBreakdown?.currency} granularity={granularity} chartType="area" height={224} />
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold capitalize">Cost by {detailGroupBy}</h3>
              <CostExplorerVisualization series={[]} breakdown={detail?.breakdown ?? []} currency={detail?.currency ?? selectedBreakdown?.currency} granularity={granularity} chartType="bar" mode="breakdown" height={Math.max(180, Math.min(320, (detail?.breakdown.length ?? 0) * 38))} />
            </div>

            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Evidence and freshness</AlertTitle>
              <AlertDescription>
                Values are read from stored provider billing evidence. Latest covered cost date: {detail?.latestCostDate ? format(parseISO(detail.latestCostDate), "PPP") : "not available"}. Forecasts and savings estimates are not included.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => {
                if (groupBy === "service") setService(selectedBreakdown?.key ?? "");
                if (groupBy === "region") setRegion(selectedBreakdown?.key ?? "");
                setPage(0);
                setSelectedBreakdown(null);
              }}>Apply as explorer filter</Button>
              <Button variant="outline" onClick={() => navigate("/cost-monitors")}>View cost monitors</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
