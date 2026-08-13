import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, Play, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssessments, useComplianceOverview, useFailingControls, useFrameworkControls, useFrameworks, useRunAssessment } from "@/hooks/use-compliance";
import { useFindings } from "@/hooks/use-findings";
import { isTerminalQueueState, useQueueJobStatus } from "@/hooks/use-queue-job";
import { useToast } from "@/hooks/use-toast";
import type { ComplianceAssessment, ComplianceControl } from "@/types";
import { SocBadge, SocButton, SocPanel, SocProgress, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

function severityTone(severity?: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  if (severity === "low") return "blue" as const;
  return "slate" as const;
}

function compactDate(value?: string) {
  if (!value) return "never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "never";
  return date.toLocaleString();
}

function statusForControl(control: ComplianceControl, failingIds: Set<string>) {
  return failingIds.has(control.controlId) ? "failing" : "passing";
}

export default function Compliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState("");
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [assessmentJobId, setAssessmentJobId] = useState<number | null>(null);
  const [notifiedAssessmentJobStatus, setNotifiedAssessmentJobStatus] = useState<string | null>(null);

  const { data: overview } = useComplianceOverview();
  const { data: frameworks = [] } = useFrameworks();
  const { data: controls = [], isLoading: controlsLoading } = useFrameworkControls(selectedFrameworkId);
  const { data: failingControls = [] } = useFailingControls(selectedFrameworkId);
  const { data: assessments = [] } = useAssessments(selectedFrameworkId);
  const { data: complianceFindingsResponse } = useFindings({ findingType: "compliance_violation", status: "open", page: 1, pageSize: 100 });
  const { mutate: runAssessment, isPending: assessmentRunning } = useRunAssessment();
  const { data: assessmentJobStatus, error: assessmentJobStatusError, isFetching: isFetchingAssessmentJob } = useQueueJobStatus(assessmentJobId);

  useEffect(() => {
    if (!selectedFrameworkId && frameworks.length > 0) {
      setSelectedFrameworkId((frameworks.find((framework) => framework.isEnabled) ?? frameworks[0]).id);
    }
  }, [frameworks, selectedFrameworkId]);

  const selectedFramework = frameworks.find((framework) => framework.id === selectedFrameworkId);
  const failingIds = useMemo(() => new Set(failingControls.map((finding) => finding.controlId)), [failingControls]);
  const selectedControl = controls.find((control) => control.id === selectedControlId || control.controlId === selectedControlId) ?? controls.find((control) => failingIds.has(control.controlId)) ?? controls[0] ?? null;
  const selectedFinding = complianceFindingsResponse?.data?.find((finding) => {
    if (!selectedControl) return false;
    const target = `${finding.ruleId ?? ""} ${finding.externalId ?? ""} ${finding.title}`.toLowerCase();
    return target.includes(selectedControl.controlId.toLowerCase());
  }) ?? complianceFindingsResponse?.data?.[0] ?? null;

  const activeAssessmentJobStatus = assessmentJobStatus?.status ?? (assessmentJobId ? "available" : undefined);
  const assessmentJobIsActive = !!assessmentJobId && !assessmentJobStatusError && !isTerminalQueueState(activeAssessmentJobStatus);
  const compliancePercent = overview?.compliancePercent ?? 0;
  const passingCount = overview?.passedControls ?? controls.filter((control) => !failingIds.has(control.controlId)).length;
  const failingCount = overview?.failedControls ?? failingControls.length;
  const totalControls = overview?.totalControls ?? controls.length;
  const enabledFrameworks = frameworks.filter((framework) => framework.isEnabled).length;

  const groupedControls = Object.entries(controls.reduce<Record<string, ComplianceControl[]>>((groups, control) => {
    const category = control.category || "General";
    groups[category] = groups[category] ?? [];
    groups[category].push(control);
    return groups;
  }, {}));

  useEffect(() => {
    if (!assessmentJobStatus || !isTerminalQueueState(assessmentJobStatus.status)) return;
    const key = `${assessmentJobStatus.id}:${assessmentJobStatus.status}`;
    if (notifiedAssessmentJobStatus === key) return;
    setNotifiedAssessmentJobStatus(key);
    queryClient.invalidateQueries({ queryKey: ["findings"] });
    queryClient.invalidateQueries({
      predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/v1/compliance"),
    });
    toast({
      title: assessmentJobStatus.status === "completed" ? "Assessment complete" : "Assessment did not complete",
      description: assessmentJobStatus.lastError || assessmentJobStatus.status,
      variant: assessmentJobStatus.status === "completed" ? "default" : "destructive",
    });
  }, [assessmentJobStatus, notifiedAssessmentJobStatus, queryClient, toast]);

  const handleRunAssessment = () => {
    if (!selectedFrameworkId) {
      toast({ title: "No framework selected", description: "Select a framework before running an assessment.", variant: "destructive" });
      return;
    }
    runAssessment(selectedFrameworkId, {
      onSuccess: (result) => {
        if ("jobId" in result && result.jobId) {
          setAssessmentJobId(result.jobId);
          setNotifiedAssessmentJobStatus(null);
          toast({ title: result.duplicate ? "Assessment already queued" : "Assessment queued", description: `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` });
        } else {
          toast({ title: "Assessment started", description: "Compliance assessment is running in the background." });
        }
      },
      onError: (error: Error) => toast({ title: "Assessment failed", description: error.message, variant: "destructive" }),
    });
  };

  const downloadAssessment = (assessment?: ComplianceAssessment) => {
    const rows = assessment
      ? [["Framework", assessment.frameworkName], ["Assessment date", assessment.assessmentDate], ["Status", assessment.status], ["Compliance percent", assessment.compliancePercent]]
      : [["Framework", selectedFramework?.name || "All frameworks"], ["Compliance percent", compliancePercent], ["Passed controls", passingCount], ["Failed controls", failingCount], ["Total controls", totalControls]];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `infraudit-compliance-${assessment?.id || new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SocWorkspace section="Governance / Compliance" title="Audit Readiness" counts={{ findings: complianceFindingsResponse?.totalItems ?? 0 }}>
      {assessmentJobId && (
        <SocPanel className="mb-4">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              {assessmentJobIsActive || isFetchingAssessmentJob ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : assessmentJobStatus?.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-green-400" /> : <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
              <div>
                <p className="text-sm font-medium text-foreground">Compliance assessment job #{assessmentJobId}</p>
                <p className="font-mono text-xs text-muted-foreground">{activeAssessmentJobStatus ?? "queued"}</p>
              </div>
            </div>
            <SocBadge tone={assessmentJobStatus?.status === "completed" ? "green" : "blue"}>{activeAssessmentJobStatus ?? "queued"}</SocBadge>
          </div>
        </SocPanel>
      )}

      <div className="grid min-h-[calc(100vh-130px)] overflow-hidden rounded-md border border-border bg-card xl:grid-cols-[330px_minmax(0,1fr)_420px]">
        <aside className="border-b border-border xl:border-b-0 xl:border-r">
          <div className="border-b border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Frameworks</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">Audit Readiness</h2>
          </div>
          <div className="max-h-[calc(100vh-210px)] space-y-3 overflow-auto p-3">
            {frameworks.map((framework) => {
              const frameworkSummary = overview?.byFramework?.find((item) => item.frameworkId === framework.id);
              const percent = frameworkSummary?.compliancePercent ?? (framework.id === selectedFrameworkId ? compliancePercent : 0);
              return (
                <button
                  key={framework.id}
                  type="button"
                  onClick={() => setSelectedFrameworkId(framework.id)}
                  className={cn("w-full rounded border border-border bg-background p-4 text-left hover:border-border", selectedFrameworkId === framework.id && "border-blue-500 bg-blue-500/10")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{framework.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">{framework.version || "current"} · {frameworkSummary?.totalControls ?? "?"} controls</p>
                    </div>
                    {!framework.isEnabled && <SocBadge tone="slate">off</SocBadge>}
                  </div>
                  <div className="mt-4"><SocProgress value={percent} tone={percent >= 80 ? "green" : percent >= 60 ? "yellow" : "red"} /></div>
                  <div className="mt-3 flex justify-between font-mono text-xs">
                    <span className="text-emerald-600 dark:text-green-400">{frameworkSummary?.passedControls ?? 0}✓</span>
                    <span className="text-red-600 dark:text-red-400">{frameworkSummary?.failedControls ?? 0}×</span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
          <div className="border-b border-border p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Selected Framework</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{selectedFramework?.name || "Select framework"}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <SocButton variant="ghost" onClick={() => downloadAssessment()}><Download className="h-4 w-4" /> Export Evidence</SocButton>
                <SocButton onClick={handleRunAssessment} disabled={assessmentRunning || assessmentJobIsActive || !selectedFrameworkId}>{assessmentRunning || assessmentJobIsActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run Assessment</SocButton>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <SocStat label="Readiness" value={`${compliancePercent}%`} tone={compliancePercent >= 80 ? "green" : "yellow"} />
              <SocStat label="Passing" value={passingCount} tone="green" />
              <SocStat label="Failing" value={failingCount} tone="red" />
              <SocStat label="Enabled" value={`${enabledFrameworks}/${frameworks.length}`} />
            </div>
          </div>
          <div className="max-h-[calc(100vh-330px)] overflow-auto p-5">
            {controlsLoading ? (
              <div className="font-mono text-sm text-muted-foreground">Loading controls...</div>
            ) : groupedControls.length === 0 ? (
              <div className="text-sm text-muted-foreground">No controls returned for this framework.</div>
            ) : (
              <div className="space-y-4">
                {groupedControls.map(([category, items]) => (
                  <SocPanel key={category} title={category} actions={<span className="font-mono text-xs text-muted-foreground">{items.filter((item) => failingIds.has(item.controlId)).length} failing · {items.length} total</span>}>
                    <div className="divide-y divide-border">
                      {items.map((control) => {
                        const status = statusForControl(control, failingIds);
                        return (
                          <button
                            key={control.id}
                            type="button"
                            onClick={() => setSelectedControlId(control.id)}
                            className={cn("grid w-full grid-cols-[32px_86px_minmax(0,1fr)_104px_68px] items-center gap-3 px-4 py-3 text-left hover:bg-muted/60", selectedControl?.id === control.id && "bg-primary/10")}
                          >
                            {status === "passing" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-green-400" /> : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            <span className="font-mono text-sm text-muted-foreground">{control.controlId}</span>
                            <span className="truncate text-sm text-foreground">{control.title}</span>
                            <SocBadge tone={severityTone(control.severity)}>{control.severity}</SocBadge>
                            <span className="font-mono text-xs text-muted-foreground">{failingIds.has(control.controlId) ? "fail" : "pass"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </SocPanel>
                ))}
              </div>
            )}
          </div>
        </main>

        <section className="min-w-0">
          {selectedControl ? (
            <>
              <div className="border-b border-border p-5">
                <p className="font-mono text-xs text-muted-foreground">{selectedControl.controlId}</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{selectedControl.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SocBadge tone={severityTone(selectedControl.severity)}>{selectedControl.severity}</SocBadge>
                  <SocBadge tone={failingIds.has(selectedControl.controlId) ? "red" : "green"}>{failingIds.has(selectedControl.controlId) ? "failing" : "passing"}</SocBadge>
                </div>
              </div>
              <div className="max-h-[calc(100vh-260px)] overflow-auto p-5">
                <p className="text-sm leading-6 text-muted-foreground">{selectedControl.description || "No description is available for this control."}</p>
                <div className="mt-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Mapped Resources</p>
                  <p className="mt-2 font-mono text-sm text-foreground">{failingControls.find((item) => item.controlId === selectedControl.controlId)?.affectedCount ?? 0} resource(s) evaluated</p>
                </div>
                <div className="mt-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Evaluated Policy</p>
                  <pre className="mt-2 max-h-32 overflow-auto rounded border border-border bg-muted/40 p-3 text-xs text-foreground">package cis.{selectedControl.controlId.replace(/\./g, "_")}
default allow = false
allow {"{ input.evidence.status == \"passed\" }"}</pre>
                </div>
                <div className="mt-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Evidence JSON</p>
                  <pre className="mt-2 max-h-44 overflow-auto rounded border border-border bg-muted/40 p-3 text-xs text-foreground">{JSON.stringify({
                    status: failingIds.has(selectedControl.controlId) ? "failing" : "passing",
                    controlId: selectedControl.controlId,
                    scanner: selectedFinding?.scannerType || selectedFinding?.sourceType || "OPA",
                    fingerprint: selectedFinding?.fingerprint,
                  }, null, 2)}</pre>
                </div>
                <div className="mt-6 border-l-2 border-blue-500 px-4 text-sm leading-6 text-foreground">
                  {selectedControl.remediation || failingControls.find((item) => item.controlId === selectedControl.controlId)?.remediation || "No remediation guidance is available for this control."}
                </div>
                <div className="mt-6 space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>First seen</span><span>{compactDate(selectedFinding?.firstSeenAt)}</span></div>
                  <div className="flex justify-between"><span>Last seen</span><span>{compactDate(selectedFinding?.lastSeenAt)}</span></div>
                  <div className="flex justify-between"><span>Confidence</span><span>{selectedFinding?.confidence || "high"}</span></div>
                </div>
              </div>
              <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-2">
                <SocButton onClick={() => downloadAssessment()}><Download className="h-4 w-4" /> Export</SocButton>
                <SocButton variant="ghost" onClick={() => selectedFinding && (window.location.href = `/findings/${selectedFinding.id}`)}>Open Finding</SocButton>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Select a control to inspect audit evidence.</div>
          )}
        </section>
      </div>

      {assessments.length > 0 && (
        <SocPanel className="mt-4" eyebrow="Assessment History" title="Recent evidence snapshots">
          <div className="divide-y divide-border">
            {assessments.slice(0, 5).map((assessment) => (
              <button key={assessment.id} type="button" onClick={() => downloadAssessment(assessment)} className="grid w-full gap-3 px-4 py-3 text-left hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
                <span className="font-medium text-foreground">{assessment.frameworkName}</span>
                <span className="font-mono text-sm text-muted-foreground">{assessment.status}</span>
                <span className="font-mono text-sm text-foreground">{assessment.compliancePercent}%</span>
                <span className="font-mono text-sm text-muted-foreground">{compactDate(assessment.assessmentDate)}</span>
              </button>
            ))}
          </div>
        </SocPanel>
      )}
    </SocWorkspace>
  );
}
