import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  CircleDot,
  EyeOff,
  ExternalLink,
  Fingerprint,
  KeyRound,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Siren,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFindings, useFindingSummary, useUpdateFindingStatus } from "@/hooks/use-findings";
import type { Finding, FindingParams, FindingStatus } from "@/lib/api";
import { findingEvidence, formatFindingLabel } from "@/components/findings/finding-ui";
import { EmptyPanel } from "@/components/security-ops/ops-ui";
import { SocBadge, SocButton, SocPanel, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

const severities = ["all", "critical", "high", "medium", "low", "info"];
const statuses = ["open", "all", "resolved", "accepted", "false_positive", "ignored"];
const clouds = ["all", "aws", "gcp", "azure", "kubernetes"];

function findingLane(finding: Finding) {
  if (finding.status === "resolved") return "Resolved";
  if (finding.severity === "critical" || finding.severity === "high") return "Priority";
  if (finding.findingType === "compliance_violation") return "Audit";
  if (finding.findingType === "exposure" || finding.findingType === "misconfiguration") return "Exposure";
  return "Watch";
}

function severityRank(severity?: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[String(severity ?? "").toLowerCase()] ?? 0;
}

function severityTone(severity?: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  if (severity === "low") return "blue" as const;
  return "slate" as const;
}

function typeIcon(type?: string) {
  if (type === "secret") return KeyRound;
  if (type === "cve" || type === "vulnerability") return Bug;
  if (type === "exposure") return Siren;
  return Fingerprint;
}

function compactDate(value?: string) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString();
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <div className="mt-2 break-words font-mono text-sm text-foreground">{children}</div>
    </div>
  );
}

function FindingRow({ finding, selected, onSelect }: { finding: Finding; selected: boolean; onSelect: () => void }) {
  const Icon = typeIcon(finding.findingType);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("grid w-full grid-cols-[34px_minmax(0,1fr)_96px] gap-3 border-b border-border px-4 py-4 text-left hover:bg-muted/60", selected && "border-l-2 border-l-blue-500 bg-primary/10")}
    >
      <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <SocBadge tone={severityTone(finding.severity)}>{finding.severity}</SocBadge>
          <SocBadge tone={finding.provider === "aws" ? "orange" : finding.provider === "gcp" ? "blue" : "cyan"}>{finding.provider || "unknown"}</SocBadge>
          <span className="font-mono text-xs uppercase text-muted-foreground">{finding.externalId || finding.ruleId || `FND-${finding.id}`}</span>
          <span className="font-mono text-xs text-muted-foreground">· {formatFindingLabel(finding.scannerType || finding.sourceType)}</span>
        </div>
        <h3 className="mt-2 truncate text-base font-medium text-foreground">{finding.title}</h3>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{finding.resourceId || "not resource scoped"}</p>
        {(finding.externalId || finding.ruleId) && <p className="mt-1 font-mono text-xs text-blue-300">{finding.externalId || finding.ruleId}</p>}
      </div>
      <span className="font-mono text-xs text-muted-foreground">{compactDate(finding.lastSeenAt)}</span>
    </button>
  );
}

export default function Findings() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("open");
  const [cloud, setCloud] = useState("all");
  const [activeLane, setActiveLane] = useState("Priority");
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);

  const params: FindingParams = {
    page: 1,
    pageSize: 100,
    severity: severity === "all" ? undefined : severity,
    status: status === "all" ? undefined : status,
    provider: cloud === "all" ? undefined : cloud,
  };

  const { data: findingsResponse, isLoading, isError, error } = useFindings(params);
  const { data: summary } = useFindingSummary();
  const updateStatus = useUpdateFindingStatus();
  const findings = findingsResponse?.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return findings
      .filter((finding) => {
        if (!query) return true;
        return [
          finding.title,
          finding.description,
          finding.resourceId,
          finding.provider,
          finding.resourceType,
          finding.scannerType,
          finding.ruleId,
          finding.externalId,
          finding.fingerprint,
        ].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }, [findings, search]);

  const lanes = ["Priority", "Exposure", "Audit", "Watch", "Resolved"].map((lane) => ({
    lane,
    items: filtered.filter((finding) => findingLane(finding) === lane),
  }));
  const visibleQueue = lanes.find((lane) => lane.lane === activeLane)?.items ?? filtered;
  const selectedFinding = filtered.find((finding) => finding.id === selectedFindingId) ?? visibleQueue[0] ?? filtered[0] ?? null;
  const byType = summary?.byType ?? {};
  const evidence = findingEvidence(selectedFinding);
  const evidenceEntries = Object.entries(evidence).filter(([, value]) => value !== "" && value !== undefined && value !== null);

  const handleStatusChange = (nextStatus: FindingStatus) => {
    if (!selectedFinding) return;
    updateStatus.mutate(
      { id: selectedFinding.id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${nextStatus.replace(/_/g, " ")}.` }),
        onError: (err: Error) => toast({ title: "Could not update finding", description: err.message, variant: "destructive" }),
      },
    );
  };

  return (
    <SocWorkspace
      section="Operations / Findings"
      title="Findings Console"
      counts={{ findings: summary?.total ?? findingsResponse?.totalItems ?? 0 }}
    >
      {isError && (
        <div className="mb-4">
          <EmptyPanel icon={AlertTriangle} title="Could not load findings" description={error instanceof Error ? error.message : "The findings API returned an error."} />
        </div>
      )}

      <div className="grid min-h-[calc(100vh-130px)] overflow-hidden rounded-md border border-border bg-card xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <aside className="border-b border-border xl:border-b-0 xl:border-r">
          <div className="border-b border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Signal Stack</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">Investigation Lanes</h2>
          </div>
          <div className="space-y-2 p-3">
            {lanes.map((lane) => (
              <button
                key={lane.lane}
                type="button"
                onClick={() => setActiveLane(lane.lane)}
                className={cn("flex h-12 w-full items-center justify-between rounded border border-transparent px-3 text-left text-foreground hover:border-border hover:bg-muted", activeLane === lane.lane && "border-primary/40 bg-primary/10 text-primary")}
              >
                <span className="flex items-center gap-3">
                  {lane.lane === "Priority" ? <Siren className="h-4 w-4 text-red-600 dark:text-red-400" /> : lane.lane === "Exposure" ? <ShieldOff className="h-4 w-4 text-orange-600 dark:text-orange-400" /> : lane.lane === "Audit" ? <ShieldCheck className="h-4 w-4 text-yellow-600 dark:text-yellow-300" /> : lane.lane === "Resolved" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-green-400" /> : <CircleDot className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {lane.lane}
                </span>
                <span className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">{lane.items.length}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Type Facets</p>
            <div className="space-y-2">
              {Object.entries(byType).slice(0, 8).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between font-mono text-sm uppercase text-foreground">
                  <span>{formatFindingLabel(type)}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
          <div className="grid gap-3 border-b border-border p-3 lg:grid-cols-[minmax(0,1fr)_145px_132px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="rule, resource, CVE, fingerprint..." className="h-10 border-border bg-background pl-9 font-mono text-foreground placeholder:text-muted-foreground" />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="h-10 border-border bg-background font-mono text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={cloud} onValueChange={setCloud}>
              <SelectTrigger className="h-10 border-border bg-background font-mono text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{clouds.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 font-mono text-xs text-muted-foreground">
            <span>{visibleQueue.length} matching</span>
            <span>·</span>
            <span>lane {activeLane.toLowerCase()}</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="ml-auto h-8 w-[150px] border-border bg-background font-mono text-xs text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-auto">
            {isLoading ? (
              <div className="p-8 font-mono text-sm text-muted-foreground">Loading normalized findings...</div>
            ) : visibleQueue.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">No findings in this lane.</div>
            ) : (
              visibleQueue.map((finding) => (
                <FindingRow key={finding.id} finding={finding} selected={selectedFinding?.id === finding.id} onSelect={() => setSelectedFindingId(finding.id)} />
              ))
            )}
          </div>
        </main>

        <section className="min-w-0">
          {!selectedFinding ? (
            <div className="p-6 text-sm text-muted-foreground">Select a finding to inspect evidence.</div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5">
                <div className="flex flex-wrap gap-2">
                  <SocBadge tone={severityTone(selectedFinding.severity)}>{selectedFinding.severity}</SocBadge>
                  <SocBadge tone={selectedFinding.status === "open" ? "orange" : "slate"}>{selectedFinding.status}</SocBadge>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{formatFindingLabel(selectedFinding.findingType)}</span>
                  {selectedFinding.confidence && <span className="font-mono text-xs uppercase text-muted-foreground">{selectedFinding.confidence} conf.</span>}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">{selectedFinding.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedFinding.description || "No description is attached to this finding."}</p>
              </div>
              <div className="max-h-[calc(100vh-310px)] flex-1 overflow-auto p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailField label="ID">FND-{selectedFinding.id}</DetailField>
                  <DetailField label="External">{selectedFinding.externalId || selectedFinding.ruleId || "none"}</DetailField>
                  <DetailField label="Provider">{selectedFinding.provider || "unknown"}</DetailField>
                  <DetailField label="Scanner">{selectedFinding.scannerType || selectedFinding.sourceType}</DetailField>
                  <DetailField label="First Seen">{compactDate(selectedFinding.firstSeenAt)}</DetailField>
                  <DetailField label="Last Seen">{compactDate(selectedFinding.lastSeenAt)}</DetailField>
                </div>
                <div className="mt-5">
                  <DetailField label="Resource">{selectedFinding.resourceId || "not resource scoped"}</DetailField>
                </div>
                <div className="mt-5">
                  <DetailField label="Fingerprint">{selectedFinding.fingerprint}</DetailField>
                </div>
                <div className="mt-5">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Evidence</p>
                  <pre className="max-h-64 overflow-auto rounded border border-border bg-muted/40 p-4 text-xs text-foreground">
                    {evidenceEntries.length ? JSON.stringify(evidence, null, 2) : "No structured evidence was stored for this finding."}
                  </pre>
                </div>
                <div className="mt-5 border-l-2 border-blue-500 px-4 text-sm leading-6 text-foreground">
                  {selectedFinding.remediation || "No remediation guidance is attached yet."}
                </div>
              </div>
              <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-2">
                <SocButton onClick={() => handleStatusChange("resolved")} disabled={updateStatus.isPending}><CheckCircle2 className="h-4 w-4" /> Resolve</SocButton>
                <SocButton variant="ghost" onClick={() => handleStatusChange("accepted")} disabled={updateStatus.isPending}><Shield className="h-4 w-4" /> Accept Risk</SocButton>
                <SocButton variant="ghost" onClick={() => handleStatusChange("false_positive")} disabled={updateStatus.isPending}><XCircle className="h-4 w-4" /> False Positive</SocButton>
                <SocButton variant="ghost" onClick={() => handleStatusChange("ignored")} disabled={updateStatus.isPending}><EyeOff className="h-4 w-4" /> Ignore</SocButton>
                <Button asChild variant="ghost" className="h-10 border border-border bg-background text-foreground hover:bg-muted sm:col-span-2">
                  <a href={`/findings/${selectedFinding.id}`}><ExternalLink className="mr-2 h-4 w-4" /> Full Page</a>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </SocWorkspace>
  );
}
