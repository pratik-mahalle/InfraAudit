import { useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { AlertCircle, Check, CheckCircle2, Clock3, History, Loader2, Mail, MessageSquare, RefreshCw, Send, Siren } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import {
  useAcknowledgeCostMonitorIncident,
  useCostMonitorIncidentHistory,
  useCostMonitorIncidents,
  useEscalateCostMonitorIncident,
} from "@/hooks/use-cost-notifications";
import { cn, formatCurrency } from "@/lib/utils";
import type { CostMonitorIncident } from "@/types";

type IncidentFilter = "all" | "open" | "acknowledged" | "resolved";

const incidentStatusStyle: Record<CostMonitorIncident["status"], string> = {
  open: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  acknowledged: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function CostMonitorIncidents() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("manage_billing");
  const [statusFilter, setStatusFilter] = useState<IncidentFilter>("all");
  const [historyID, setHistoryID] = useState<string>();
  const incidentsQuery = useCostMonitorIncidents({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const acknowledge = useAcknowledgeCostMonitorIncident();
  const escalate = useEscalateCostMonitorIncident();
  const incidents = incidentsQuery.data?.incidents ?? [];
  const active = useMemo(() => incidents.filter((incident) => incident.status !== "resolved"), [incidents]);

  const actionError = (error: unknown) => toast({
    title: "Incident update failed",
    description: error instanceof Error ? error.message : "Try again.",
    variant: "destructive",
  });

  const acknowledgeIncident = (incident: CostMonitorIncident) => acknowledge.mutate({
    id: incident.id,
    note: "Acknowledged from the cost monitor console.",
  }, {
    onSuccess: () => toast({ title: "Incident acknowledged", description: `${incident.monitorName} remains tracked until cost returns healthy or it is escalated.` }),
    onError: actionError,
  });

  const escalateIncident = (incident: CostMonitorIncident) => escalate.mutate({
    id: incident.id,
    note: "Manual escalation requested from the cost monitor console.",
  }, {
    onSuccess: () => toast({ title: "Incident escalated", description: "Enabled Slack and email channels were notified again; results are recorded in history." }),
    onError: actionError,
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Siren className="h-4 w-4" />Breach incidents</CardTitle>
              <CardDescription className="mt-1">A durable record of threshold transitions, operator acknowledgements, escalations, recoveries, and channel delivery outcomes.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={active.length > 0 ? "destructive" : "outline"}>{active.length} active</Badge>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IncidentFilter)}>
                <SelectTrigger className="h-8 w-[145px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All incidents</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="acknowledged">Acknowledged</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {incidentsQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          ) : incidentsQuery.isError ? (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Incident history could not be loaded</AlertTitle><AlertDescription><Button variant="outline" size="sm" className="mt-2" onClick={() => incidentsQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></AlertDescription></Alert>
          ) : incidents.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-3 font-medium">No {statusFilter === "all" ? "breach" : statusFilter} incidents</p><p className="mt-1 text-sm text-muted-foreground">A warning or critical transition will open an incident and route it to enabled channels once.</p></div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Monitor</TableHead><TableHead>Status</TableHead><TableHead>Observed / threshold</TableHead><TableHead>Opened</TableHead><TableHead>Escalation</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell><p className="font-medium">{incident.monitorName}</p><p className="text-xs uppercase text-muted-foreground">{incident.provider}{incident.cloudAccountId ? ` · ${incident.cloudAccountId}` : ""}</p></TableCell>
                      <TableCell><div className="flex flex-col items-start gap-1"><Badge variant="outline" className={cn("capitalize", incidentStatusStyle[incident.status])}>{incident.status}</Badge><span className={cn("text-xs capitalize", incident.severity === "critical" ? "text-red-600" : "text-amber-600")}>{incident.severity}</span></div></TableCell>
                      <TableCell><p className="font-medium">{formatCurrency(incident.currentValue, incident.currency)}</p><p className="text-xs text-muted-foreground">threshold {formatCurrency(incident.threshold, incident.currency)}</p></TableCell>
                      <TableCell><p className="whitespace-nowrap text-sm">{formatDistanceToNow(parseISO(incident.openedAt), { addSuffix: true })}</p><p className="text-xs text-muted-foreground">{format(parseISO(incident.openedAt), "PPp")}</p></TableCell>
                      <TableCell><p className="text-sm">Level {incident.escalationLevel}</p><p className="text-xs text-muted-foreground">{incident.lastEscalatedAt ? formatDistanceToNow(parseISO(incident.lastEscalatedAt), { addSuffix: true }) : "Not escalated"}</p></TableCell>
                      <TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setHistoryID(incident.id)}><History className="mr-2 h-3.5 w-3.5" />History</Button>{canManage && incident.status === "open" && <Button variant="outline" size="sm" onClick={() => acknowledgeIncident(incident)} disabled={acknowledge.isPending}><Check className="mr-2 h-3.5 w-3.5" />Acknowledge</Button>}{canManage && incident.status !== "resolved" && <Button variant="destructive" size="sm" onClick={() => escalateIncident(incident)} disabled={escalate.isPending}><Siren className="mr-2 h-3.5 w-3.5" />Escalate</Button>}</div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <IncidentHistoryDialog id={historyID} open={Boolean(historyID)} onOpenChange={(open) => !open && setHistoryID(undefined)} />
    </>
  );
}

function IncidentHistoryDialog({ id, open, onOpenChange }: { id?: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const historyQuery = useCostMonitorIncidentHistory(id);
  const history = historyQuery.data;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Incident and delivery history</DialogTitle><DialogDescription>{history?.incident.monitorName ?? "Loading the durable lifecycle record…"}</DialogDescription></DialogHeader>
        {historyQuery.isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : historyQuery.isError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>History unavailable</AlertTitle><AlertDescription>{historyQuery.error instanceof Error ? historyQuery.error.message : "Try again."}</AlertDescription></Alert> : history ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Lifecycle</p><Badge variant="outline" className={cn("mt-2 capitalize", incidentStatusStyle[history.incident.status])}>{history.incident.status}</Badge></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Observed</p><p className="mt-1 font-semibold">{formatCurrency(history.incident.currentValue, history.incident.currency)}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Escalation level</p><p className="mt-1 font-semibold">{history.incident.escalationLevel}</p></div></div>
            <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" />Lifecycle events</h3><div className="space-y-2">{history.events.map((event) => <div key={event.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-3"><Badge variant="outline" className="capitalize">{event.eventType.replaceAll("_", " ")}</Badge><span className="text-xs text-muted-foreground">{format(parseISO(event.createdAt), "PPp")}</span></div>{event.note && <p className="mt-2 text-sm text-muted-foreground">{event.note}</p>}<p className="mt-1 text-xs text-muted-foreground">{event.actorProfileId ? `Actor profile ${event.actorProfileId}` : "System event"}</p></div>)}{history.events.length === 0 && <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p>}</div></section>
            <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Send className="h-4 w-4" />Delivery attempts</h3><div className="space-y-2">{history.deliveries.map((delivery) => <div key={delivery.id} className={cn("rounded-lg border p-3", delivery.status === "failed" && "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20")}><div className="flex flex-wrap items-center gap-2">{delivery.channel === "slack" ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}<span className="font-medium capitalize">{delivery.channel}</span><Badge variant={delivery.status === "failed" ? "destructive" : "outline"}>{delivery.status}</Badge><span className="ml-auto text-xs text-muted-foreground">{format(parseISO(delivery.attemptedAt), "PPp")}</span></div><p className="mt-2 text-xs text-muted-foreground">{delivery.trigger} · {delivery.destinationHint || "configured destination"}</p>{delivery.errorMessage && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{delivery.errorCategory}: {delivery.errorMessage}</p>}</div>)}{history.deliveries.length === 0 && <p className="text-sm text-muted-foreground">No Slack or email attempts were recorded for this incident.</p>}</div></section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
