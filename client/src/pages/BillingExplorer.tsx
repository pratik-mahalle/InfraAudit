import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Database,
  Download,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCostAccounts, useCostExplorer } from "@/hooks/use-costs";
import type { CostExplorerFilters } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostMonitorWidget } from "@/components/cost/CostMonitorWidget";

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
  const totalPages = Math.max(1, Math.ceil((result?.totalBreakdownRows ?? 0) / PAGE_SIZE));
  const selectedDayDifference = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
  const selectedDays = Number.isFinite(selectedDayDifference) ? Math.max(1, selectedDayDifference + 1) : 1;
  const averageDailyCost = (result?.totalCost ?? 0) / selectedDays;
  const isStale = result?.latestCostDate
    ? Date.now() - parseISO(result.latestCostDate).getTime() > 72 * 60 * 60 * 1000
    : false;

  const chartData = useMemo(() => (result?.series ?? []).map((point) => ({
    period: format(parseISO(point.period), granularity === "monthly" ? "MMM yyyy" : "MMM d"),
    cost: point.cost,
  })), [result?.series, granularity]);

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
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Cost over time</CardTitle><CardDescription>{result?.lastUpdatedAt ? `Imported ${format(parseISO(result.lastUpdatedAt), "PPp")}` : "No import timestamp available"}</CardDescription></CardHeader>
          <CardContent className="h-72">
            {explorerQuery.isLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : chartData.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No cost history matches this scope.</div> : (
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period" tick={{ fontSize: 12 }}/><YAxis tick={{ fontSize: 12 }} width={70}/><Tooltip formatter={(value: number) => money(value, result?.currency)}/><Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="url(#costFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base capitalize">Cost by {groupBy}</CardTitle><CardDescription>{result?.totalBreakdownRows ?? 0} billing dimensions in the selected scope.</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table><TableHeader><TableRow><TableHead className="capitalize">{groupBy}</TableHead><TableHead>Provider</TableHead><TableHead>Cloud account</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader><TableBody>
                {(result?.breakdown ?? []).map((item) => <TableRow key={`${item.provider}:${item.cloudAccountId}:${item.key}`}><TableCell className="font-medium">{item.key}</TableCell><TableCell><Badge variant="outline" className="uppercase">{item.provider}</Badge></TableCell><TableCell className="font-mono text-xs">{item.cloudAccountId}</TableCell><TableCell className="text-right font-medium">{money(item.cost, item.currency)}</TableCell></TableRow>)}
                {!explorerQuery.isLoading && !result?.breakdown.length && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No detailed billing rows found.</TableCell></TableRow>}
              </TableBody></Table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>Page {page + 1} of {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</Button><Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
