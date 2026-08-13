import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  AlertTriangle,
  BellRing,
  Bug,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  GitCompareArrows,
  Loader2,
  Network,
  Play,
  Search,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from "@/hooks/use-alerts";
import { useComplianceOverview } from "@/hooks/use-compliance";
import { useAcknowledgeDrift, useApproveDriftAsBaseline, useDrifts, useResolveDrift, useTriggerDriftDetection } from "@/hooks/use-drifts";
import { useFindings, useFindingSummary, useUpdateFindingStatus } from "@/hooks/use-findings";
import { isTerminalQueueState, useQueueJobStatus } from "@/hooks/use-queue-job";
import { useProviders } from "@/hooks/use-providers";
import { useResources } from "@/hooks/use-resources";
import { useTriggerVulnerabilityScan, useVulnerabilities } from "@/hooks/use-vulnerabilities";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Alert, Drift, Finding, FindingStatus, QueueJobStatus, Vulnerability } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SocBadge, SocButton, SocPanel, SocProgress, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";

type SecurityView = "overview" | "findings" | "vulnerabilities" | "compliance" | "alerts" | "drifts";
type SignalType = "Finding" | "Alert" | "Drift" | "Vulnerability";

type SignalItem = {
  id: string;
  title: string;
  description?: string;
  severity: string;
  type: SignalType;
  displayId: string;
  status?: string;
  source?: string;
  provider?: string;
  resourceId?: string | number;
  resourceName: string;
  resourceType?: string;
  findingType?: string;
  time?: string;
  raw: Alert | Drift | Finding | Vulnerability;
};

const viewOptions: Array<{ id: SecurityView; label: string; icon: React.ElementType }> = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "findings", label: "Findings", icon: Fingerprint },
  { id: "vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { id: "compliance", label: "Compliance", icon: CheckCircle2 },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "drifts", label: "Drifts", icon: GitCompareArrows },
];

const severities = ["all", "critical", "high", "medium", "low", "info"];
const statuses = ["all", "open", "detected", "acknowledged", "accepted", "resolved", "fixed", "patched", "ignored"];

function viewFromQuery(view?: string): SecurityView {
  switch (view) {
    case "findings":
      return "findings";
    case "vulnerabilities":
      return "vulnerabilities";
    case "compliance":
      return "compliance";
    case "alerts":
      return "alerts";
    case "drifts":
      return "drifts";
    default:
      return "overview";
  }
}

function queryFromView(view: SecurityView) {
  if (view === "overview") return "all";
  return view;
}

function severityRank(severity?: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[String(severity ?? "").toLowerCase()] ?? 0;
}

function riskWeight(severity?: string) {
  if (severity === "critical") return 10;
  if (severity === "high") return 6;
  if (severity === "medium") return 3;
  if (severity === "low") return 1;
  return 0;
}

function pct(closed: number, total: number) {
  return total ? Math.round((closed / total) * 100) : 100;
}

function resourceName(resources: Array<{ id?: number; resourceId?: string; name: string }>, id?: number | string) {
  if (!id) return "No resource linked";
  return resources.find((resource) => resource.id === id || resource.resourceId === String(id))?.name ?? String(id);
}

function severityTone(severity?: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  if (severity === "low") return "blue" as const;
  return "slate" as const;
}

function statusTone(status?: string) {
  if (status === "resolved" || status === "fixed" || status === "patched") return "green" as const;
  if (status === "acknowledged" || status === "accepted") return "blue" as const;
  if (status === "ignored" || status === "false_positive") return "slate" as const;
  return "orange" as const;
}

function isClosedStatus(status?: string) {
  return ["resolved", "fixed", "patched", "ignored", "false_positive", "accepted", "approved"].includes(String(status ?? "").toLowerCase());
}

function formatLabel(value?: string) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isVulnerabilitySignal(item: SignalItem) {
  const type = String(item.findingType ?? item.type).toLowerCase();
  return item.type === "Vulnerability" || type === "cve" || type === "vulnerability";
}

function patchLane(item: SignalItem) {
  if (item.severity === "critical") return "Emergency";
  if (item.severity === "high") return "Patch Window";
  if (item.description || item.status === "open") return "Fix Ready";
  return "Backlog";
}

function queueStatusLabel(status?: string, error?: string) {
  if (!status) return "No job started";
  if (status === "completed") return "Completed";
  if (status === "discarded") return error ? `Failed: ${error}` : "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "running") return "Running";
  if (status === "retryable") return error ? `Retrying: ${error}` : "Retrying";
  return formatLabel(status);
}

function ScanJobCard({ label, jobId, job, isFetching, error }: { label: string; jobId: number | null; job?: QueueJobStatus; isFetching: boolean; error: unknown }) {
  const status = job?.status ?? (jobId ? "available" : undefined);
  const active = !!jobId && !error && !isTerminalQueueState(status);
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{jobId ? `Job #${jobId}` : "Start a scan to track job progress here."}</p>
        </div>
        {(active || isFetching) ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <SocBadge tone={status === "completed" ? "green" : error ? "red" : "slate"}>{status ?? "idle"}</SocBadge>}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{queueStatusLabel(status, job?.lastError)}</p>
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-background p-8 text-center">
      <Shield className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SignalFilters({
  search,
  setSearch,
  severity,
  setSeverity,
  status,
  setStatus,
  provider,
  setProvider,
  providers,
}: {
  search: string;
  setSearch: (value: string) => void;
  severity: string;
  setSeverity: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  provider: string;
  setProvider: (value: string) => void;
  providers: string[];
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-3 lg:grid-cols-[minmax(220px,1fr)_150px_150px_150px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resource, rule, CVE, scanner..." className="pl-9" />
      </div>
      <Select value={severity} onValueChange={setSeverity}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{formatLabel(item)}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{formatLabel(item)}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={provider} onValueChange={setProvider}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Providers</SelectItem>
          {providers.map((item) => <SelectItem key={item} value={item}>{item.toUpperCase()}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SignalTable({ items, selectedId, onSelect }: { items: SignalItem[]; selectedId?: string | null; onSelect: (item: SignalItem) => void }) {
  if (items.length === 0) {
    return <EmptyState title="No matching signals" description="Adjust filters or run a scan to populate this view." />;
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[860px] text-left">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Signal</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Resource</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium text-right">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} onClick={() => onSelect(item)} className={cn("cursor-pointer hover:bg-muted/50", selectedId === item.id && "bg-primary/10")}>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.displayId} · {item.type}</p>
              </td>
              <td className="px-4 py-3"><SocBadge tone={severityTone(item.severity)}>{item.severity}</SocBadge></td>
              <td className="px-4 py-3"><SocBadge tone={statusTone(item.status)}>{formatLabel(item.status)}</SocBadge></td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{item.resourceName}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatLabel(item.source)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{item.time ? formatTimeAgo(item.time) : "unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function evidenceEntries(item: SignalItem | null) {
  if (!item || item.type !== "Finding") return [];
  const evidence = (item.raw as Finding).evidence;
  if (!evidence) return [];
  try {
    const parsed = JSON.parse(evidence);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).slice(0, 8);
    }
  } catch {
    return [["evidence", evidence]];
  }
  return [["evidence", evidence]];
}

function formatEvidenceValue(value: unknown) {
  if (value == null) return "Not provided";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2 break-words text-sm font-medium text-foreground">{value || "Unknown"}</div>
    </div>
  );
}

function SignalDetailDrawer({
  item,
  open,
  onOpenChange,
  relatedSignals,
  onPrimary,
  onSecondary,
  onApproveBaseline,
  onOpenResource,
  isPending,
}: {
  item: SignalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedSignals: SignalItem[];
  onPrimary: () => void;
  onSecondary: () => void;
  onApproveBaseline: () => void;
  onOpenResource: () => void;
  isPending: boolean;
}) {
  const remediation = item?.type === "Finding" || item?.type === "Vulnerability"
    ? (item.raw as Finding | Vulnerability).remediation
    : undefined;
  const driftTips = item?.type === "Drift" ? (item.raw as Drift).remediationTips ?? [] : [];
  const evidence = evidenceEntries(item);

  if (!item) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col overflow-y-auto p-0 sm:max-w-xl lg:max-w-2xl">
        <SheetHeader className="border-b border-border p-6 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SocBadge tone={severityTone(item.severity)}>{item.severity}</SocBadge>
            <SocBadge tone={statusTone(item.status)}>{formatLabel(item.status)}</SocBadge>
            <span className="font-mono text-xs text-muted-foreground">{item.type}</span>
          </div>
          <SheetTitle className="mt-3 text-xl leading-7">{item.title}</SheetTitle>
          <SheetDescription className="font-mono">{item.displayId}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 p-6">
          <section>
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description || "No description is attached to this signal."}</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <MetaRow label="Resource" value={item.resourceName} />
            <MetaRow label="Detected" value={item.time ? formatTimeAgo(item.time) : "unknown"} />
            <MetaRow label="Source" value={formatLabel(item.source)} />
            <MetaRow label="Provider" value={item.provider || "unknown"} />
            {item.resourceType && <MetaRow label="Resource Type" value={item.resourceType} />}
            {item.findingType && <MetaRow label="Finding Type" value={formatLabel(item.findingType)} />}
          </section>

          {(remediation || driftTips.length > 0) && (
            <section className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Remediation</h3>
              {remediation && <p className="mt-2 text-sm leading-6 text-muted-foreground">{remediation}</p>}
              {driftTips.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {driftTips.map((tip) => <li key={tip} className="rounded-md bg-background p-2">{tip}</li>)}
                </ul>
              )}
            </section>
          )}

          {evidence.length > 0 && (
            <section className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
              <div className="mt-3 divide-y divide-border rounded-md border border-border bg-background">
                {evidence.map(([key, value]) => (
                  <div key={key} className="grid gap-2 p-3 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                    <span className="font-mono text-xs uppercase text-muted-foreground">{formatLabel(key)}</span>
                    <span className="break-words text-foreground">{formatEvidenceValue(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedSignals.length > 0 && (
            <section className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Related signals on this resource</h3>
              <div className="mt-3 space-y-2">
                {relatedSignals.map((signal) => (
                  <div key={signal.id} className="rounded-md border border-border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SocBadge tone={severityTone(signal.severity)}>{signal.severity}</SocBadge>
                      <span className="font-mono text-xs text-muted-foreground">{signal.displayId}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{signal.title}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 grid gap-2 border-t border-border bg-background p-4 sm:grid-cols-2">
          <SocButton onClick={onPrimary} disabled={isPending}>
            <Play className="h-4 w-4" />
            {item.type === "Vulnerability" ? "Show Vulnerabilities" : "Resolve"}
          </SocButton>
          <SocButton variant="ghost" onClick={onSecondary} disabled={isPending}>
            <Shield className="h-4 w-4" />
            {item.type === "Finding" ? "Accept Risk" : item.type === "Vulnerability" ? "Show Findings" : "Acknowledge"}
          </SocButton>
          {item.type === "Drift" && (
            <SocButton variant="ghost" onClick={onApproveBaseline} disabled={isPending}>
              <Network className="h-4 w-4" />
              Approve Baseline
            </SocButton>
          )}
          {item.resourceId && (
            <SocButton variant="ghost" onClick={onOpenResource}>
              <ExternalLink className="h-4 w-4" />
              Resource
            </SocButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function SecurityMonitoring({ defaultTab = "risk" }: { defaultTab?: string }) {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const requestedView = viewFromQuery(new URLSearchParams(searchParams).get("view") ?? defaultTab);
  const [activeView, setActiveView] = useState<SecurityView>(requestedView);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [vulnerabilityJobId, setVulnerabilityJobId] = useState<number | null>(null);
  const [driftJobId, setDriftJobId] = useState<number | null>(null);

  const { data: providers = [], isLoading: providersLoading } = useProviders();
  const { data: alertsResponse, isLoading: alertsLoading, isError: alertsError } = useAlerts();
  const { data: complianceOverview, isLoading: complianceLoading, isError: complianceError } = useComplianceOverview();
  const { data: driftsResponse, isLoading: driftsLoading, isError: driftsError } = useDrifts();
  const { data: findingsResponse, isLoading: findingsLoading, isError: findingsError } = useFindings({ page: 1, pageSize: 100 });
  const { data: findingSummary } = useFindingSummary();
  const { data: vulnerabilitiesResponse, isLoading: vulnerabilitiesLoading, isError: vulnerabilitiesError } = useVulnerabilities();
  const { data: resourcesResponse } = useResources();
  const { data: vulnerabilityJob, error: vulnerabilityJobError, isFetching: vulnerabilityJobFetching } = useQueueJobStatus(vulnerabilityJobId);
  const { data: driftJob, error: driftJobError, isFetching: driftJobFetching } = useQueueJobStatus(driftJobId);

  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const acknowledgeDrift = useAcknowledgeDrift();
  const resolveDrift = useResolveDrift();
  const approveDrift = useApproveDriftAsBaseline();
  const updateFindingStatus = useUpdateFindingStatus();
  const triggerDriftDetection = useTriggerDriftDetection();
  const triggerVulnerabilityScan = useTriggerVulnerabilityScan();

  useEffect(() => {
    setActiveView(requestedView);
    setSelectedItemId(null);
    setDetailOpen(false);
  }, [requestedView]);

  const alerts: Alert[] = alertsResponse?.data ?? [];
  const drifts: Drift[] = Array.isArray(driftsResponse) ? driftsResponse : driftsResponse?.data ?? [];
  const findings: Finding[] = findingsResponse?.data ?? [];
  const vulnerabilities: Vulnerability[] = Array.isArray(vulnerabilitiesResponse) ? vulnerabilitiesResponse : vulnerabilitiesResponse?.data ?? [];
  const resources = resourcesResponse?.data ?? [];
  const connectedProviders = providers.filter((item) => item.isConnected);
  const openFindings = findings.filter((finding) => !isClosedStatus(finding.status));
  const openAlerts = alerts.filter((alert) => alert.status !== "resolved");
  const openDrifts = drifts.filter((drift) => drift.status === "detected" || drift.status === "acknowledged");
  const openVulnerabilities = vulnerabilities.filter((vulnerability) => vulnerability.status === "open");

  const legacyVulnerabilitiesWithoutFinding = useMemo(() => {
    const findingTargets = findings.map((finding) => `${finding.externalId ?? ""} ${finding.ruleId ?? ""} ${finding.title}`.toLowerCase());
    return openVulnerabilities.filter((vulnerability) => {
      const cve = vulnerability.cveId ?? vulnerability.vulnerabilityId;
      if (cve && findingTargets.some((target) => target.includes(cve.toLowerCase()))) return false;
      return !findingTargets.some((target) => target.includes(vulnerability.title.toLowerCase()));
    });
  }, [findings, openVulnerabilities]);

  const allSignals: SignalItem[] = useMemo(() => [
    ...findings.map((finding) => ({
      id: `finding-${finding.id}`,
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      type: "Finding" as const,
      displayId: finding.externalId || finding.ruleId || `FND-${finding.id}`,
      status: finding.status,
      source: finding.scannerType || finding.sourceType,
      provider: finding.provider,
      resourceId: finding.resourceId,
      resourceName: finding.resourceId || "No resource linked",
      resourceType: finding.resourceType,
      findingType: String(finding.findingType),
      time: finding.lastSeenAt || finding.firstSeenAt,
      raw: finding,
    })),
    ...openAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.message,
      severity: alert.severity,
      type: "Alert" as const,
      displayId: `ALT-${alert.id}`,
      status: alert.status,
      source: alert.type,
      resourceId: alert.resourceId,
      resourceName: resourceName(resources, alert.resourceId),
      time: alert.createdAt,
      raw: alert,
    })),
    ...openDrifts.map((drift) => ({
      id: `drift-${drift.id}`,
      title: formatLabel(drift.driftType),
      description: drift.description,
      severity: drift.severity,
      type: "Drift" as const,
      displayId: `DRF-${drift.id}`,
      status: drift.status,
      source: drift.driftType,
      resourceId: drift.resourceIdStr || drift.resourceId,
      resourceName: drift.resourceIdStr || resourceName(resources, drift.resourceId),
      time: drift.detectedAt,
      raw: drift,
    })),
    ...legacyVulnerabilitiesWithoutFinding.map((vulnerability) => ({
      id: `vuln-${vulnerability.id}`,
      title: vulnerability.title,
      description: vulnerability.description,
      severity: vulnerability.severity,
      type: "Vulnerability" as const,
      displayId: vulnerability.cveId ?? vulnerability.vulnerabilityId ?? `VUL-${vulnerability.id}`,
      status: vulnerability.status,
      source: vulnerability.scannerType,
      provider: vulnerability.provider,
      resourceId: vulnerability.resourceId,
      resourceName: resourceName(resources, vulnerability.resourceId),
      resourceType: vulnerability.resourceType,
      findingType: "vulnerability",
      time: vulnerability.lastSeenAt || vulnerability.firstSeenAt || vulnerability.detectedAt,
      raw: vulnerability,
    })),
  ].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()), [findings, legacyVulnerabilitiesWithoutFinding, openAlerts, openDrifts, resources]);

  const openSecuritySignals = useMemo(() => allSignals.filter((item) => !isClosedStatus(item.status)), [allSignals]);

  const viewSignals = useMemo(() => {
    switch (activeView) {
      case "findings":
        return allSignals.filter((item) => item.type === "Finding");
      case "vulnerabilities":
        return allSignals.filter(isVulnerabilitySignal);
      case "compliance":
        return allSignals.filter((item) => item.findingType === "compliance_violation");
      case "alerts":
        return allSignals.filter((item) => item.type === "Alert");
      case "drifts":
        return allSignals.filter((item) => item.type === "Drift");
      default:
        return openSecuritySignals;
    }
  }, [activeView, allSignals, openSecuritySignals]);

  const providerOptions = useMemo(() => Array.from(new Set(allSignals.map((item) => item.provider).filter(Boolean) as string[])).sort(), [allSignals]);
  const filteredSignals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return viewSignals.filter((item) => {
      if (severity !== "all" && item.severity !== severity) return false;
      if (status !== "all" && item.status !== status) return false;
      if (provider !== "all" && item.provider !== provider) return false;
      if (!query) return true;
      return [
        item.title,
        item.description,
        item.displayId,
        item.resourceName,
        item.resourceId,
        item.resourceType,
        item.provider,
        item.source,
        item.findingType,
      ].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [provider, search, severity, status, viewSignals]);

  const selectedItem = filteredSignals.find((item) => item.id === selectedItemId) ?? null;
  const relatedSignals = selectedItem
    ? allSignals.filter((item) => item.id !== selectedItem.id && selectedItem.resourceId && String(item.resourceId) === String(selectedItem.resourceId)).slice(0, 6)
    : [];
  const loading = providersLoading || alertsLoading || driftsLoading || findingsLoading || vulnerabilitiesLoading || complianceLoading;
  const hasLoadError = alertsError || driftsError || findingsError || vulnerabilitiesError || complianceError;
  const criticalOpen = openSecuritySignals.filter((item) => item.severity === "critical").length;
  const highOpen = openSecuritySignals.filter((item) => item.severity === "high").length;
  const alertClosure = pct(alerts.filter((alert) => alert.status === "resolved").length, alerts.length);
  const driftClosure = pct(drifts.filter((drift) => drift.status === "resolved" || drift.status === "approved").length, drifts.length);
  const vulnerabilityClosure = pct(vulnerabilities.filter((vulnerability) => vulnerability.status === "fixed" || vulnerability.status === "patched").length, vulnerabilities.length);
  const findingTotal = findingSummary?.total ?? findingsResponse?.totalItems ?? findings.length;
  const failedControls = complianceOverview?.failedControls ?? 0;
  const totalControls = complianceOverview?.totalControls ?? 0;
  const compliancePercent = complianceOverview?.compliancePercent ?? 0;
  const postureIndex = Math.max(0, 100 - Math.min(100, openSecuritySignals.reduce((sum, item) => sum + riskWeight(item.severity), 0)));

  const resourceRisk = useMemo(() => {
    const rows = new Map<string, {
      resource: string;
      provider?: string;
      type?: string;
      count: number;
      maxSeverity: string;
      lastSeen?: string;
      resourceId?: string | number;
    }>();

    openSecuritySignals.forEach((item) => {
      if (!item.resourceId && item.resourceName === "No resource linked") return;
      const key = String(item.resourceId ?? item.resourceName);
      const existing = rows.get(key);
      const current = existing ?? {
        resource: item.resourceName,
        provider: item.provider,
        type: item.resourceType,
        count: 0,
        maxSeverity: item.severity,
        lastSeen: item.time,
        resourceId: item.resourceId,
      };
      current.count += 1;
      if (severityRank(item.severity) > severityRank(current.maxSeverity)) current.maxSeverity = item.severity;
      if (item.time && (!current.lastSeen || new Date(item.time).getTime() > new Date(current.lastSeen).getTime())) current.lastSeen = item.time;
      current.provider = current.provider || item.provider;
      current.type = current.type || item.resourceType;
      rows.set(key, current);
    });

    return Array.from(rows.values()).sort((a, b) => b.count - a.count || severityRank(b.maxSeverity) - severityRank(a.maxSeverity)).slice(0, 8);
  }, [openSecuritySignals]);

  const navigateView = (view: SecurityView) => {
    navigate(`/security?view=${queryFromView(view)}`);
  };

  const openSignalDetail = (item: SignalItem) => {
    setSelectedItemId(item.id);
    setDetailOpen(true);
  };

  const runDriftScan = () => {
    triggerDriftDetection.mutate(undefined, {
      onSuccess: (result) => {
        setDriftJobId(result.jobId ?? null);
        toast({
          title: result.jobId ? "Drift scan queued" : "Drift scan started",
          description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking resource configuration drift.",
        });
      },
      onError: (error: Error) => toast({ title: "Could not start drift scan", description: error.message, variant: "destructive" }),
    });
  };

  const runVulnerabilityScan = () => {
    triggerVulnerabilityScan.mutate(undefined, {
      onSuccess: (result) => {
        setVulnerabilityJobId(result.jobId ?? null);
        toast({
          title: result.jobId ? "Vulnerability scan queued" : "Vulnerability scan started",
          description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking vulnerable packages and resources.",
        });
      },
      onError: (error: Error) => toast({ title: "Could not start vulnerability scan", description: error.message, variant: "destructive" }),
    });
  };

  const updateSelectedFindingStatus = (nextStatus: FindingStatus) => {
    if (!selectedItem || selectedItem.type !== "Finding") return;
    updateFindingStatus.mutate(
      { id: (selectedItem.raw as Finding).id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${formatLabel(nextStatus)}.` }),
        onError: (error: Error) => toast({ title: "Could not update finding", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handlePrimaryAction = () => {
    if (!selectedItem) return;
    if (selectedItem.type === "Alert") {
      resolveAlert.mutate((selectedItem.raw as Alert).id, {
        onSuccess: () => toast({ title: "Alert resolved", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not resolve alert", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Drift") {
      resolveDrift.mutate((selectedItem.raw as Drift).id, {
        onSuccess: () => toast({ title: "Drift resolved", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not resolve drift", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Finding") {
      updateSelectedFindingStatus("resolved");
    } else {
      navigateView("vulnerabilities");
    }
  };

  const handleSecondaryAction = () => {
    if (!selectedItem) return;
    if (selectedItem.type === "Alert") {
      acknowledgeAlert.mutate((selectedItem.raw as Alert).id, {
        onSuccess: () => toast({ title: "Alert acknowledged", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not acknowledge alert", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Drift") {
      acknowledgeDrift.mutate((selectedItem.raw as Drift).id, {
        onSuccess: () => toast({ title: "Drift acknowledged", description: selectedItem.title }),
        onError: (error: Error) => toast({ title: "Could not acknowledge drift", description: error.message, variant: "destructive" }),
      });
    } else if (selectedItem.type === "Finding") {
      updateSelectedFindingStatus("accepted");
    } else {
      navigateView("findings");
    }
  };

  const handleApproveBaseline = () => {
    if (!selectedItem || selectedItem.type !== "Drift") return;
    approveDrift.mutate((selectedItem.raw as Drift).id, {
      onSuccess: () => toast({ title: "Baseline approved", description: selectedItem.title }),
      onError: (error: Error) => toast({ title: "Could not approve baseline", description: error.message, variant: "destructive" }),
    });
  };

  const actionPending = resolveAlert.isPending || resolveDrift.isPending || acknowledgeAlert.isPending || acknowledgeDrift.isPending || approveDrift.isPending || updateFindingStatus.isPending;

  const counters = [
    { view: "findings" as const, label: "Findings", value: openFindings.length, total: findingTotal, icon: Fingerprint, tone: "orange" as const, helper: `${findingTotal} total` },
    { view: "alerts" as const, label: "Alerts", value: openAlerts.length, total: alerts.length, icon: BellRing, tone: "yellow" as const, helper: `${alertClosure}% resolved` },
    { view: "drifts" as const, label: "Drifts", value: openDrifts.length, total: drifts.length, icon: GitCompareArrows, tone: "blue" as const, helper: `${driftClosure}% closed` },
    { view: "vulnerabilities" as const, label: "Vulnerabilities", value: openVulnerabilities.length, total: vulnerabilities.length, icon: Bug, tone: "red" as const, helper: `${vulnerabilityClosure}% fixed` },
    { view: "compliance" as const, label: "Failed Controls", value: failedControls, total: totalControls, icon: Shield, tone: failedControls > 0 ? "red" as const : "green" as const, helper: totalControls ? `${compliancePercent}% passing` : "No controls" },
  ];

  const renderScanStatus = () => (
    <div className="grid gap-3 md:grid-cols-2">
      <ScanJobCard label="Vulnerability scan" jobId={vulnerabilityJobId} job={vulnerabilityJob} isFetching={vulnerabilityJobFetching} error={vulnerabilityJobError} />
      <ScanJobCard label="Drift scan" jobId={driftJobId} job={driftJob} isFetching={driftJobFetching} error={driftJobError} />
    </div>
  );

  const renderResourceConcentration = () => (
    <SocPanel eyebrow="Resource Concentration" title="Resources with open security signals">
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Open Signals</th>
              <th className="px-4 py-3 font-medium">Highest Severity</th>
              <th className="px-4 py-3 font-medium">Last Seen</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {resourceRisk.length === 0 ? (
              <tr><td className="px-4 py-8 text-sm text-muted-foreground" colSpan={7}>No resource-linked security signals are open.</td></tr>
            ) : resourceRisk.map((item) => (
              <tr key={String(item.resourceId ?? item.resource)} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-mono text-sm text-foreground">{item.resource}</td>
                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{item.type || "unknown"}</td>
                <td className="px-4 py-3"><SocBadge tone={item.provider === "aws" ? "orange" : item.provider === "gcp" ? "blue" : item.provider === "azure" ? "cyan" : "slate"}>{item.provider || "unknown"}</SocBadge></td>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{item.count}</td>
                <td className="px-4 py-3"><SocBadge tone={severityTone(item.maxSeverity)}>{item.maxSeverity}</SocBadge></td>
                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{item.lastSeen ? formatTimeAgo(item.lastSeen) : "unknown"}</td>
                <td className="px-4 py-3 text-right">
                  {item.resourceId && (
                    <button type="button" onClick={() => navigate(`/resources/${encodeURIComponent(String(item.resourceId))}`)} className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SocPanel>
  );

  const renderOverview = () => (
    <div className="space-y-5">
      {connectedProviders.length === 0 && !providersLoading && (
        <EmptyState
          title="No cloud providers connected"
          description="Connect a provider before running scans or reviewing security signals."
          action={<SocButton onClick={() => navigate("/cloud-providers")}>Open Cloud Providers</SocButton>}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.6fr)]">
        <SocPanel>
          <div className="flex h-full flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Current Posture</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Open security work</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Built from loaded alerts, drifts, normalized findings, vulnerability results, and compliance overview data.
                </p>
              </div>
              {hasLoadError ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            </div>
            <div className="grid gap-3 sm:grid-cols-[128px_minmax(0,1fr)]">
              <div className={cn("flex h-32 w-32 items-center justify-center rounded-lg border-[10px]", postureIndex >= 75 ? "border-green-500/40" : postureIndex >= 50 ? "border-orange-500/60" : "border-red-500/60")}>
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{postureIndex}</p>
                  <p className="text-xs text-muted-foreground">Index</p>
                </div>
              </div>
              <div className="grid gap-3">
                <SocStat label="Critical" value={criticalOpen} tone={criticalOpen > 0 ? "red" : "green"} />
                <SocStat label="High" value={highOpen} tone={highOpen > 0 ? "orange" : "green"} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SocButton onClick={runVulnerabilityScan} disabled={triggerVulnerabilityScan.isPending || connectedProviders.length === 0}>
                {triggerVulnerabilityScan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
                Run Vulnerability Scan
              </SocButton>
              <SocButton variant="ghost" onClick={runDriftScan} disabled={triggerDriftDetection.isPending || connectedProviders.length === 0}>
                {triggerDriftDetection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
                Run Drift Scan
              </SocButton>
            </div>
          </div>
        </SocPanel>

        <div className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 xl:grid-cols-5">
          {counters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigateView(item.view)}
              className="border-b border-border p-4 text-left transition-colors hover:bg-muted/60 sm:odd:border-r xl:border-b-0 xl:border-r"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><item.icon className="h-4 w-4 shrink-0" /> <span className="truncate">{item.label}</span></span>
                <SocBadge tone="slate">{item.total}</SocBadge>
              </div>
              <p className={cn("mt-4 text-3xl font-semibold", item.tone === "red" && "text-red-600 dark:text-red-300", item.tone === "orange" && "text-orange-600 dark:text-orange-300", item.tone === "yellow" && "text-yellow-600 dark:text-yellow-300", item.tone === "blue" && "text-blue-600 dark:text-blue-300", item.tone === "green" && "text-emerald-600 dark:text-green-300")}>{item.value}</p>
              <div className="mt-3"><SocProgress value={item.total ? Math.round((item.value / item.total) * 100) : 0} tone={item.tone} /></div>
              <p className="mt-3 text-xs text-muted-foreground">{item.helper}</p>
            </button>
          ))}
        </div>
      </div>

      {renderScanStatus()}

      <div>
        <SocPanel eyebrow="Investigation Queue" title="Open signals sorted by severity" actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <SocBadge tone="slate">{filteredSignals.length} shown</SocBadge>}>
          {hasLoadError && <div className="border-b border-border p-4 text-sm text-red-700 dark:text-red-300">Some security data could not be loaded.</div>}
          <SignalTable items={filteredSignals.slice(0, 12)} selectedId={selectedItem?.id} onSelect={openSignalDetail} />
        </SocPanel>
      </div>

      {renderResourceConcentration()}
    </div>
  );

  const renderFindings = () => (
    <div className="space-y-4">
      <SignalFilters search={search} setSearch={setSearch} severity={severity} setSeverity={setSeverity} status={status} setStatus={setStatus} provider={provider} setProvider={setProvider} providers={providerOptions} />
      <SignalTable items={filteredSignals} selectedId={selectedItem?.id} onSelect={openSignalDetail} />
    </div>
  );

  const renderVulnerabilities = () => {
    const lanes = ["Emergency", "Patch Window", "Fix Ready", "Backlog"].map((lane) => ({
      lane,
      items: filteredSignals.filter((item) => patchLane(item) === lane),
    }));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SocButton onClick={runVulnerabilityScan} disabled={triggerVulnerabilityScan.isPending || connectedProviders.length === 0}>
            {triggerVulnerabilityScan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            Run Vulnerability Scan
          </SocButton>
        </div>
        {renderScanStatus()}
        <SignalFilters search={search} setSearch={setSearch} severity={severity} setSeverity={setSeverity} status={status} setStatus={setStatus} provider={provider} setProvider={setProvider} providers={providerOptions} />
        <div className="grid gap-4 xl:grid-cols-4">
          {lanes.map((lane) => (
            <SocPanel key={lane.lane} title={lane.lane} actions={<SocBadge tone="slate">{lane.items.length}</SocBadge>}>
              <div className="space-y-3 p-3">
                {lane.items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No items.</div>
                ) : lane.items.map((item) => (
                  <button key={item.id} type="button" onClick={() => openSignalDetail(item)} className={cn("w-full rounded-md border border-border bg-background p-3 text-left hover:bg-muted", selectedItem?.id === item.id && "border-primary bg-primary/10")}>
                    <div className="flex items-center justify-between gap-2">
                      <SocBadge tone={severityTone(item.severity)}>{item.severity}</SocBadge>
                      <span className="text-xs text-muted-foreground">{item.time ? formatTimeAgo(item.time) : "unknown"}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{item.displayId}</p>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{item.resourceName}</p>
                  </button>
                ))}
              </div>
            </SocPanel>
          ))}
        </div>
      </div>
    );
  };

  const renderCompliance = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SocStat label="Readiness" value={`${compliancePercent}%`} tone={compliancePercent >= 80 ? "green" : compliancePercent >= 60 ? "yellow" : "red"} />
        <SocStat label="Controls" value={totalControls} tone="blue" />
        <SocStat label="Passing" value={complianceOverview?.passedControls ?? 0} tone="green" />
        <SocStat label="Failing" value={failedControls} tone={failedControls > 0 ? "red" : "green"} />
      </div>
      <SignalFilters search={search} setSearch={setSearch} severity={severity} setSeverity={setSeverity} status={status} setStatus={setStatus} provider={provider} setProvider={setProvider} providers={providerOptions} />
      <SignalTable items={filteredSignals} selectedId={selectedItem?.id} onSelect={openSignalDetail} />
    </div>
  );

  const renderCurrentView = () => {
    if (activeView === "overview") return renderOverview();
    if (activeView === "vulnerabilities") return renderVulnerabilities();
    if (activeView === "compliance") return renderCompliance();
    return renderFindings();
  };

  return (
    <SocWorkspace section="Security" title="Security Command Center" counts={{ findings: findings.length, vulnerabilities: openVulnerabilities.length }}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateView(item.id)}
              className={cn("inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", activeView === item.id && "border-primary bg-primary/10 text-primary")}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {loading && allSignals.length === 0 ? (
          <EmptyState title="Loading security data" description="Fetching provider status, security signals, vulnerability results, and compliance overview." action={<Loader2 className="h-5 w-5 animate-spin text-primary" />} />
        ) : renderCurrentView()}
        <SignalDetailDrawer
          item={selectedItem}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          relatedSignals={relatedSignals}
          onPrimary={handlePrimaryAction}
          onSecondary={handleSecondaryAction}
          onApproveBaseline={handleApproveBaseline}
          onOpenResource={() => selectedItem?.resourceId && navigate(`/resources/${encodeURIComponent(String(selectedItem.resourceId))}`)}
          isPending={actionPending}
        />
      </div>
    </SocWorkspace>
  );
}
