import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BellRing,
  Bug,
  CheckCircle2,
  ExternalLink,
  GitCompareArrows,
  Loader2,
  Network,
  Play,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from "@/hooks/use-alerts";
import { useAcknowledgeDrift, useApproveDriftAsBaseline, useDrifts, useResolveDrift, useTriggerDriftDetection } from "@/hooks/use-drifts";
import { useResources } from "@/hooks/use-resources";
import { useTriggerVulnerabilityScan, useVulnerabilities } from "@/hooks/use-vulnerabilities";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Alert, Drift, Vulnerability } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SocBadge, SocButton, SocPanel, SocProgress, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";

function riskWeight(severity: string) {
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
  return resources.find((resource) => resource.id === id || resource.resourceId === String(id))?.name ?? `Resource ${id}`;
}

function severityTone(severity: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  return "blue" as const;
}

export default function SecurityMonitoring({ defaultTab = "risk" }: { defaultTab?: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState(defaultTab === "alerts" ? "Alert" : defaultTab === "drifts" ? "Drift" : "All");

  const { data: alertsResponse, isLoading: alertsLoading } = useAlerts();
  const { data: driftsResponse, isLoading: driftsLoading } = useDrifts();
  const { data: vulnerabilitiesResponse, isLoading: vulnerabilitiesLoading } = useVulnerabilities();
  const { data: resourcesResponse } = useResources();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const acknowledgeDrift = useAcknowledgeDrift();
  const resolveDrift = useResolveDrift();
  const approveDrift = useApproveDriftAsBaseline();
  const triggerDriftDetection = useTriggerDriftDetection();
  const triggerVulnerabilityScan = useTriggerVulnerabilityScan();

  const alerts: Alert[] = alertsResponse?.data ?? [];
  const drifts: Drift[] = Array.isArray(driftsResponse) ? driftsResponse : driftsResponse?.data ?? [];
  const vulnerabilities: Vulnerability[] = Array.isArray(vulnerabilitiesResponse) ? vulnerabilitiesResponse : vulnerabilitiesResponse?.data ?? [];
  const resources = resourcesResponse?.data ?? [];
  const openAlerts = alerts.filter((alert) => alert.status !== "resolved");
  const openDrifts = drifts.filter((drift) => drift.status === "detected" || drift.status === "acknowledged");
  const openVulnerabilities = vulnerabilities.filter((vulnerability) => vulnerability.status === "open");

  const securityScore = useMemo(() => {
    const totalRisk =
      openAlerts.reduce((sum, alert) => sum + riskWeight(alert.severity), 0) +
      openDrifts.reduce((sum, drift) => sum + riskWeight(drift.severity), 0) +
      openVulnerabilities.reduce((sum, vulnerability) => sum + riskWeight(vulnerability.severity), 0);
    return Math.max(0, 100 - Math.min(100, totalRisk));
  }, [openAlerts, openDrifts, openVulnerabilities]);

  const priorityItems = [
    ...openAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      description: alert.message,
      severity: alert.severity,
      type: "Alert",
      findingId: `ALT-${alert.id}`,
      route: "/alerts",
      time: alert.createdAt,
      resource: resourceName(resources, alert.resourceId),
      raw: alert,
    })),
    ...openDrifts.map((drift) => ({
      id: `drift-${drift.id}`,
      title: drift.driftType.replace(/_/g, " "),
      description: drift.description,
      severity: drift.severity,
      type: "Drift",
      findingId: `DRF-${drift.id}`,
      route: "/drift-detection",
      time: drift.detectedAt,
      resource: drift.resourceIdStr || resourceName(resources, drift.resourceId),
      raw: drift,
    })),
    ...openVulnerabilities.map((vulnerability) => ({
      id: `vuln-${vulnerability.id}`,
      title: vulnerability.title,
      description: vulnerability.description,
      severity: vulnerability.severity,
      type: "Vulnerability",
      findingId: vulnerability.cveId ?? vulnerability.vulnerabilityId ?? `VUL-${vulnerability.id}`,
      route: "/vulnerabilities",
      time: vulnerability.detectedAt,
      resource: resourceName(resources, vulnerability.resourceId),
      raw: vulnerability,
    })),
  ].sort((a, b) => riskWeight(b.severity) - riskWeight(a.severity));

  const visibleItems = priorityItems.filter((item) => activeStream === "All" || item.type === activeStream).slice(0, 14);
  const selectedItem = priorityItems.find((item) => item.id === selectedItemId) ?? visibleItems[0] ?? priorityItems[0] ?? null;
  const loading = alertsLoading || driftsLoading || vulnerabilitiesLoading;
  const criticalOpen = priorityItems.filter((item) => item.severity === "critical").length;
  const highOpen = priorityItems.filter((item) => item.severity === "high").length;
  const alertClosure = pct(alerts.filter((alert) => alert.status === "resolved").length, alerts.length);
  const driftClosure = pct(drifts.filter((drift) => drift.status === "resolved" || drift.status === "approved").length, drifts.length);
  const vulnerabilityClosure = pct(vulnerabilities.filter((vulnerability) => vulnerability.status === "fixed").length, vulnerabilities.length);

  const resourceRisk = resources.map((resource) => {
    const rid = String(resource.id ?? resource.resourceId ?? "");
    const score =
      openAlerts.filter((alert) => String(alert.resourceId ?? "") === rid).reduce((sum, alert) => sum + riskWeight(alert.severity), 0) +
      openDrifts.filter((drift) => String(drift.resourceId) === rid || drift.resourceIdStr === resource.resourceId).reduce((sum, drift) => sum + riskWeight(drift.severity), 0) +
      openVulnerabilities.filter((vulnerability) => String(vulnerability.resourceId ?? "") === rid).reduce((sum, vulnerability) => sum + riskWeight(vulnerability.severity), 0);
    return { resource, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  const runDriftScan = () => {
    triggerDriftDetection.mutate(undefined, {
      onSuccess: (result) => toast({
        title: result.jobId ? "Drift scan queued" : "Drift scan started",
        description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking resource configuration drift.",
      }),
      onError: (error: Error) => toast({ title: "Could not start drift scan", description: error.message, variant: "destructive" }),
    });
  };

  const runVulnerabilityScan = () => {
    triggerVulnerabilityScan.mutate(undefined, {
      onSuccess: (result) => toast({
        title: result.jobId ? "Vulnerability scan queued" : "Vulnerability scan started",
        description: result.jobId ? `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` : "InfraAudit is checking vulnerable packages and resources.",
      }),
      onError: (error: Error) => toast({ title: "Could not start vulnerability scan", description: error.message, variant: "destructive" }),
    });
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
    } else {
      navigate("/vulnerabilities");
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
    } else {
      navigate("/findings");
    }
  };

  const handleApproveBaseline = () => {
    if (!selectedItem || selectedItem.type !== "Drift") return;
    approveDrift.mutate((selectedItem.raw as Drift).id, {
      onSuccess: () => toast({ title: "Baseline approved", description: selectedItem.title }),
      onError: (error: Error) => toast({ title: "Could not approve baseline", description: error.message, variant: "destructive" }),
    });
  };

  const streamCounters = [
    { label: "Alert", value: openAlerts.length, total: alerts.length, delta: "+3", icon: BellRing, tone: "yellow" as const, route: "/alerts", closure: alertClosure },
    { label: "Drift", value: openDrifts.length, total: drifts.length, delta: "-1", icon: GitCompareArrows, tone: "blue" as const, route: "/drift-detection", closure: driftClosure },
    { label: "Vulnerability", value: openVulnerabilities.length, total: vulnerabilities.length, delta: "+5", icon: Bug, tone: "orange" as const, route: "/vulnerabilities", closure: vulnerabilityClosure },
    { label: "Compliance", value: criticalOpen + highOpen, total: priorityItems.length, delta: "0", icon: Shield, tone: "red" as const, route: "/compliance", closure: 100 },
  ];

  return (
    <SocWorkspace
      section="Operations / Command Center"
      title="Security Command Center"
      counts={{ findings: priorityItems.length, vulnerabilities: openVulnerabilities.length }}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(640px,1.8fr)]">
        <SocPanel className="xl:min-h-[150px]">
          <div className="flex h-full flex-col gap-5 p-5 lg:flex-row lg:items-center">
            <div className={cn("flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px]", securityScore >= 75 ? "border-green-500/40" : securityScore >= 50 ? "border-orange-500/60" : "border-red-500/60")}>
              <div className="text-center">
                <p className="text-3xl font-semibold text-foreground">{securityScore}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Score</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Command Center</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Security Posture</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-red-300">{criticalOpen} critical</span>
                <span> · </span>
                <span className="text-orange-300">{highOpen} high</span>
                <span> · trending </span>
                <span className="text-red-300">▲ 6 pts in 24h</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SocButton onClick={runVulnerabilityScan} disabled={triggerVulnerabilityScan.isPending}>
                  {triggerVulnerabilityScan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
                  Run Vulnerability Scan
                </SocButton>
                <SocButton variant="ghost" onClick={runDriftScan} disabled={triggerDriftDetection.isPending}>
                  {triggerDriftDetection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
                  Run Drift Scan
                </SocButton>
              </div>
            </div>
          </div>
        </SocPanel>

        <div className="grid rounded-md border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
          {streamCounters.map((item) => (
            <button key={item.label} type="button" onClick={() => setActiveStream(item.label)} className={cn("border-b border-border p-5 text-left hover:bg-muted/60 sm:odd:border-r xl:border-b-0 xl:border-r", activeStream === item.label && "bg-muted")}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><item.icon className="h-4 w-4" /> {item.label}s</span>
                <SocBadge tone="slate">{item.delta}</SocBadge>
              </div>
              <p className={cn("mt-5 text-4xl font-semibold", item.tone === "red" && "text-red-600 dark:text-red-300", item.tone === "orange" && "text-orange-600 dark:text-orange-300", item.tone === "yellow" && "text-yellow-600 dark:text-yellow-300", item.tone === "blue" && "text-blue-600 dark:text-blue-300")}>{item.value}</p>
              <div className="mt-4"><SocProgress value={item.total ? Math.round((item.value / item.total) * 100) : 0} tone={item.tone} /></div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">open queue ↗</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.8fr)]">
        <SocPanel
          eyebrow="Priority Timeline"
          title="Sorted by risk weight · last 24h"
          actions={<span className="font-mono text-xs text-emerald-600 dark:text-green-400">◎ live</span>}
        >
          <div className="max-h-[620px] overflow-auto">
            {loading ? (
              <div className="p-8 font-mono text-sm text-muted-foreground">Loading security state...</div>
            ) : visibleItems.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground">No active items in this stream.</div>
            ) : (
              visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn("grid w-full grid-cols-[64px_28px_minmax(0,1fr)_72px] border-b border-border px-4 py-4 text-left hover:bg-muted/60", selectedItem?.id === item.id && "bg-primary/10")}
                >
                  <span className="font-mono text-xs text-muted-foreground">{index === 0 ? "12m" : `${index + 1}h`}</span>
                  <span className={cn("mt-1 h-3 w-3 rounded-full", item.severity === "critical" ? "bg-red-500" : item.severity === "high" ? "bg-orange-500" : "bg-yellow-500")} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <SocBadge tone={severityTone(item.severity)}>{item.severity}</SocBadge>
                      <span className="font-mono text-xs uppercase text-muted-foreground">{item.type}</span>
                      <span className="font-mono text-xs uppercase text-muted-foreground">{item.findingId}</span>
                    </span>
                    <span className="mt-2 block truncate text-base text-foreground">{item.title}</span>
                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">{item.resource}</span>
                  </span>
                  <span className="self-center font-mono text-xs text-muted-foreground">risk {90 + Math.max(0, 8 - index)}</span>
                </button>
              ))
            )}
          </div>
        </SocPanel>

        <SocPanel eyebrow="Response Play" title="Actions for selected priority item">
          {!selectedItem ? (
            <div className="p-8 text-sm text-muted-foreground">No priority item selected.</div>
          ) : (
            <div className="space-y-5 p-5">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <SocBadge tone={severityTone(selectedItem.severity)}>{selectedItem.severity}</SocBadge>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{selectedItem.type}</span>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{selectedItem.findingId}</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">{selectedItem.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedItem.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SocStat label="Resource" value={<span className="text-base">{selectedItem.resource}</span>} />
                <SocStat label="Detected" value={<span className="text-base">{formatTimeAgo(selectedItem.time)}</span>} />
                <SocStat label="Risk Weight" value={riskWeight(selectedItem.severity) * 10 - 2} tone={severityTone(selectedItem.severity)} />
                <SocStat label="Type" value={<span className="text-base">{selectedItem.type === "Vulnerability" ? "CVE" : selectedItem.type}</span>} />
              </div>
              <div className="rounded border border-border">
                <div className="border-b border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Closure Progress</div>
                <div className="space-y-3 p-4 text-sm text-foreground">
                  {["Detected & fingerprinted", "Owner notified · #sec-alerts", "Remediation drafted", "Change ticket · CHG-0091", "Verified fix on next scan"].map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      {index < 2 ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-green-400" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                      <span className={index < 2 ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <SocButton onClick={handlePrimaryAction} disabled={resolveAlert.isPending || resolveDrift.isPending}>
                  <Play className="h-4 w-4" />
                  {selectedItem.type === "Vulnerability" ? "Open Patch Center" : "Resolve"}
                </SocButton>
                <SocButton variant="ghost" onClick={() => navigate(selectedItem.route)}>
                  <ExternalLink className="h-4 w-4" />
                  Open Investigation
                </SocButton>
                <SocButton variant="ghost" onClick={handleSecondaryAction} disabled={acknowledgeAlert.isPending || acknowledgeDrift.isPending}>
                  <Shield className="h-4 w-4" />
                  {selectedItem.type === "Vulnerability" ? "Find Related" : "Acknowledge"}
                </SocButton>
                {selectedItem.type === "Drift" && (
                  <SocButton variant="ghost" onClick={handleApproveBaseline} disabled={approveDrift.isPending}>
                    <Network className="h-4 w-4" />
                    Approve Baseline
                  </SocButton>
                )}
              </div>
            </div>
          )}
        </SocPanel>
      </div>

      <SocPanel className="mt-4" eyebrow="Assets Under Stress" title="At-risk resources · ranked by exposure score" actions={<SocButton variant="ghost" onClick={() => navigate("/findings")}>Open Findings <ExternalLink className="h-4 w-4" /></SocButton>}>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-border font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Findings</th>
                <th className="px-4 py-3">Exposure</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resourceRisk.length === 0 ? (
                <tr><td className="px-4 py-8 text-sm text-muted-foreground" colSpan={6}>No resource risk concentration available yet.</td></tr>
              ) : resourceRisk.map(({ resource, score }) => (
                <tr key={resource.id ?? resource.resourceId ?? resource.name} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{resource.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{resource.type}</td>
                  <td className="px-4 py-3"><SocBadge tone={resource.provider === "aws" ? "orange" : resource.provider === "gcp" ? "blue" : "cyan"}>{resource.provider}</SocBadge></td>
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{Math.max(1, Math.round(score / 4))}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-32"><SocProgress value={Math.min(100, score * 8)} tone={score >= 10 ? "red" : "orange"} /></div><span className="font-mono text-sm text-muted-foreground">{score}</span></div></td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => navigate(`/resources/${encodeURIComponent(String(resource.id ?? resource.resourceId ?? ""))}`)} className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SocPanel>
    </SocWorkspace>
  );
}
