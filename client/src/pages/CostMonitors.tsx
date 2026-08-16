import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Activity,
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  useCostAccounts,
  useCostMonitorEvaluations,
  useCostMonitors,
  useCreateCostMonitor,
  useDeleteCostMonitor,
  useEvaluateCostMonitor,
  useUpdateCostMonitor,
} from "@/hooks/use-costs";
import { usePermission } from "@/hooks/use-permission";
import type { CostMonitor, CostMonitorInput, CostMonitorStatus, CostMonitorType } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { costMonitorStatusStyle, costMonitorTypes, formatCostMonitorMetric } from "@/components/cost/cost-monitor-utils";
import { CostMonitorIncidents } from "@/components/cost/CostMonitorIncidents";
import { CostNotificationChannels } from "@/components/cost/CostNotificationChannels";

const emptyMonitor: CostMonitorInput = {
  name: "",
  provider: "aws",
  cloudAccountId: "",
  serviceName: "",
  region: "",
  monitorType: "monthly_budget",
  threshold: 100,
  warningPercent: 80,
  rollingDays: 7,
  currency: "USD",
  enabled: true,
};

function monitorInput(monitor: CostMonitor): CostMonitorInput {
  return {
    name: monitor.name,
    provider: monitor.provider,
    cloudAccountId: monitor.cloudAccountId,
    serviceName: monitor.serviceName,
    region: monitor.region,
    monitorType: monitor.monitorType,
    threshold: monitor.threshold,
    warningPercent: monitor.warningPercent,
    rollingDays: monitor.rollingDays,
    currency: monitor.currency,
    enabled: monitor.enabled,
  };
}

export default function CostMonitors() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission("manage_billing");
  const [createOpen, setCreateOpen] = useState(false);
  const [historyMonitor, setHistoryMonitor] = useState<CostMonitor | null>(null);
  const [draft, setDraft] = useState<CostMonitorInput>({ ...emptyMonitor });
  const monitorsQuery = useCostMonitors(100);
  const accountsQuery = useCostAccounts();
  const createMutation = useCreateCostMonitor();
  const updateMutation = useUpdateCostMonitor();
  const deleteMutation = useDeleteCostMonitor();
  const evaluateMutation = useEvaluateCostMonitor();
  const historyQuery = useCostMonitorEvaluations(historyMonitor?.id);
  const monitors = monitorsQuery.data?.monitors ?? [];
  const matchingAccounts = (accountsQuery.data?.accounts ?? []).filter((account) => account.provider === draft.provider);
  const counts = useMemo(() => monitors.reduce((result, monitor) => {
    result[monitor.status] = (result[monitor.status] ?? 0) + 1;
    return result;
  }, {} as Record<CostMonitorStatus, number>), [monitors]);

  const submit = () => {
    createMutation.mutate(draft, {
      onSuccess: () => {
        toast.success("Cost monitor created and evaluated");
        setCreateOpen(false);
        setDraft({ ...emptyMonitor });
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create monitor"),
    });
  };

  const toggleEnabled = (monitor: CostMonitor, enabled: boolean) => {
    updateMutation.mutate({ id: monitor.id, input: { ...monitorInput(monitor), enabled } }, {
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update monitor"),
    });
  };

  const remove = (monitor: CostMonitor) => {
    if (!window.confirm(`Delete “${monitor.name}” and its evaluation history?`)) return;
    deleteMutation.mutate(monitor.id, {
      onSuccess: () => toast.success("Cost monitor deleted"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete monitor"),
    });
  };

  const evaluate = (monitor: CostMonitor) => {
    evaluateMutation.mutate(monitor.id, {
      onSuccess: (evaluation) => toast.success(`Evaluation complete: ${evaluation.status}`),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Evaluation failed"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cost Monitor</h1>
            <p className="text-muted-foreground">Persistent thresholds evaluated after the daily cost pipeline, with evidence and alert delivery.</p>
          </div>
          {canManage && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New monitor</Button>}
        </div>

        {!canManage && (
          <Alert><BellRing className="h-4 w-4" /><AlertTitle>Read-only monitor access</AlertTitle><AlertDescription>An organization owner with billing permission can create, edit, evaluate, or remove monitors.</AlertDescription></Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardDescription>Enabled monitors</CardDescription><CardTitle>{monitors.filter((monitor) => monitor.enabled).length}</CardTitle></CardHeader><CardContent><Activity className="h-4 w-4 text-blue-500" /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Healthy</CardDescription><CardTitle>{counts.healthy ?? 0}</CardTitle></CardHeader><CardContent><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Warning / critical</CardDescription><CardTitle>{(counts.warning ?? 0) + (counts.critical ?? 0)}</CardTitle></CardHeader><CardContent><AlertCircle className="h-4 w-4 text-red-500" /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Stale / error</CardDescription><CardTitle>{(counts.stale ?? 0) + (counts.error ?? 0)}</CardTitle></CardHeader><CardContent><Clock3 className="h-4 w-4 text-orange-500" /></CardContent></Card>
        </div>

        <Alert>
          <BellRing className="h-4 w-4" />
          <AlertTitle>Transition-aware alerts without notification noise</AlertTitle>
          <AlertDescription>A warning opens one incident, critical severity escalates it, and a healthy evaluation resolves it. Repeated unchanged evaluations do not send duplicate Slack or email messages.</AlertDescription>
        </Alert>

        <CostNotificationChannels />

        <CostMonitorIncidents />

        {monitorsQuery.isError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Cost monitors could not be loaded</AlertTitle><AlertDescription>{monitorsQuery.error instanceof Error ? monitorsQuery.error.message : "Try again."}</AlertDescription></Alert>}

        <Card>
          <CardHeader><CardTitle className="text-base">Organization monitors</CardTitle><CardDescription>{monitorsQuery.data?.total ?? 0} monitor definitions and their latest evaluation.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {monitorsQuery.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            {!monitorsQuery.isLoading && monitors.length === 0 && <div className="rounded-lg border border-dashed py-12 text-center"><BellRing className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No cost monitors yet</p><p className="mt-1 text-sm text-muted-foreground">Create a budget, run-rate, daily, rolling, or period-change threshold.</p>{canManage && <Button className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create monitor</Button>}</div>}
            {monitors.map((monitor) => (
              <div key={monitor.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{monitor.name}</p><Badge variant="outline" className={cn("capitalize", costMonitorStatusStyle[monitor.status])}>{monitor.status}</Badge><Badge variant="outline" className="uppercase">{monitor.provider}</Badge>{monitor.cloudAccountId && <Badge variant="secondary" className="font-mono">{monitor.cloudAccountId}</Badge>}</div>
                    <p className="text-sm text-muted-foreground">{costMonitorTypes.find((type) => type.value === monitor.monitorType)?.label} · threshold {formatCostMonitorMetric(monitor.threshold, monitor)} · warning at {monitor.warningPercent}%</p>
                    <p className="text-xs text-muted-foreground">{monitor.serviceName ? `Service: ${monitor.serviceName} · ` : ""}{monitor.region ? `Region: ${monitor.region} · ` : ""}{monitor.lastEvaluatedAt ? `Evaluated ${format(parseISO(monitor.lastEvaluatedAt), "PPp")}` : "Not evaluated"}{monitor.nextEvaluationAt ? ` · next ${format(parseISO(monitor.nextEvaluationAt), "PPp")}` : ""}</p>
                    {monitor.lastError && <p className="text-xs text-orange-600">{monitor.lastError}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-2 text-right"><p className="text-xs text-muted-foreground">Latest value</p><p className="font-semibold">{formatCostMonitorMetric(monitor.latestValue, monitor)}</p></div>
                    <Button variant="outline" size="sm" onClick={() => setHistoryMonitor(monitor)}><History className="mr-2 h-4 w-4" /> History</Button>
                    {canManage && <Button variant="outline" size="sm" onClick={() => evaluate(monitor)} disabled={!monitor.enabled || evaluateMutation.isPending}><Play className="mr-2 h-4 w-4" /> Evaluate</Button>}
                    {canManage && <Switch checked={monitor.enabled} onCheckedChange={(enabled) => toggleEnabled(monitor, enabled)} aria-label={`${monitor.enabled ? "Disable" : "Enable"} ${monitor.name}`} />}
                    {canManage && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(monitor)}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete {monitor.name}</span></Button>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create cost monitor</DialogTitle><DialogDescription>The monitor is evaluated immediately, then after every scheduled cost pipeline.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="monitor-name">Name</Label><Input id="monitor-name" value={draft.name} placeholder="AWS monthly production budget" onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Provider</Label><Select value={draft.provider} onValueChange={(provider: "aws" | "gcp" | "azure") => setDraft((value) => ({ ...value, provider, cloudAccountId: "" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aws">AWS</SelectItem><SelectItem value="gcp">GCP</SelectItem><SelectItem value="azure">Azure</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Cloud account</Label><Select value={draft.cloudAccountId || "all"} onValueChange={(account) => setDraft((value) => ({ ...value, cloudAccountId: account === "all" ? "" : account }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {draft.provider.toUpperCase()} accounts</SelectItem>{matchingAccounts.map((account) => <SelectItem key={account.cloudAccountId} value={account.cloudAccountId}>{account.cloudAccountId} · {account.connected ? "connected" : "historical"}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>Monitor type</Label><Select value={draft.monitorType} onValueChange={(monitorType: CostMonitorType) => setDraft((value) => ({ ...value, monitorType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{costMonitorTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label} — {type.description}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="monitor-threshold">Threshold {draft.monitorType === "month_over_month" ? "(%)" : `(${draft.currency})`}</Label><Input id="monitor-threshold" type="number" min="0" step="0.01" value={draft.threshold} onChange={(event) => setDraft((value) => ({ ...value, threshold: Number(event.target.value) }))} /></div>
            <div className="space-y-2"><Label htmlFor="monitor-warning">Warning at (%)</Label><Input id="monitor-warning" type="number" min="1" max="100" value={draft.warningPercent} onChange={(event) => setDraft((value) => ({ ...value, warningPercent: Number(event.target.value) }))} /></div>
            {draft.monitorType === "rolling_spend" && <div className="space-y-2"><Label htmlFor="monitor-days">Rolling days</Label><Input id="monitor-days" type="number" min="1" max="90" value={draft.rollingDays} onChange={(event) => setDraft((value) => ({ ...value, rollingDays: Number(event.target.value) }))} /></div>}
            <div className="space-y-2"><Label htmlFor="monitor-service">Service (optional exact match)</Label><Input id="monitor-service" value={draft.serviceName} placeholder="Amazon Elastic Compute Cloud - Compute" onChange={(event) => setDraft((value) => ({ ...value, serviceName: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="monitor-region">Region (optional)</Label><Input id="monitor-region" value={draft.region} placeholder="us-east-1" onChange={(event) => setDraft((value) => ({ ...value, region: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={submit} disabled={createMutation.isPending || !draft.name.trim()}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create and evaluate</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyMonitor} onOpenChange={(open) => !open && setHistoryMonitor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>{historyMonitor?.name} history</DialogTitle><DialogDescription>Immutable evaluation evidence for threshold decisions.</DialogDescription></DialogHeader>
          {historyQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Evaluated</TableHead><TableHead>Status</TableHead><TableHead>Value</TableHead><TableHead>Threshold</TableHead><TableHead>Evidence</TableHead></TableRow></TableHeader><TableBody>
              {(historyQuery.data?.evaluations ?? []).map((evaluation) => <TableRow key={evaluation.id}><TableCell className="whitespace-nowrap">{format(parseISO(evaluation.evaluatedAt), "PPp")}</TableCell><TableCell><Badge variant="outline" className={costMonitorStatusStyle[evaluation.status]}>{evaluation.status}</Badge></TableCell><TableCell>{historyMonitor ? formatCostMonitorMetric(evaluation.value, historyMonitor) : evaluation.value}</TableCell><TableCell>{historyMonitor ? formatCostMonitorMetric(evaluation.threshold, historyMonitor) : evaluation.threshold}</TableCell><TableCell><details><summary className="cursor-pointer text-sm text-primary">View evidence</summary><pre className="mt-2 max-w-md overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(evaluation.evidence, null, 2)}</pre></details></TableCell></TableRow>)}
              {!historyQuery.data?.evaluations.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No evaluations recorded.</TableCell></TableRow>}
            </TableBody></Table></div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
