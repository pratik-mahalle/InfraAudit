import { useEffect, useState } from "react";
import { Download, FileCheck2, Fingerprint, FileText, PlayCircle, Search, ShieldCheck, ShieldX } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AssessmentHistory } from "@/components/compliance/AssessmentHistory";
import { ControlsTable } from "@/components/compliance/ControlsTable";
import { FailingControlsList } from "@/components/compliance/FailingControlsList";
import { FrameworkSelector } from "@/components/compliance/FrameworkSelector";
import { ResourceCompliancePanel } from "@/components/compliance/ResourceCompliancePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAssessments,
  useComplianceOverview,
  useFailingControls,
  useFrameworkControls,
  useFrameworks,
  useRunAssessment,
  useToggleFramework,
} from "@/hooks/use-compliance";
import { useFindings, useUpdateFindingStatus } from "@/hooks/use-findings";
import { useToast } from "@/hooks/use-toast";
import type { FindingStatus } from "@/lib/api";
import type { AssessmentFinding, ComplianceAssessment, ComplianceControl } from "@/types";
import { FindingDetailPanel, FindingRow, formatFindingLabel } from "@/components/findings/finding-ui";
import { DetailRow, EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";

export default function Compliance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("readiness");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState("");
  const [resourceIdInput, setResourceIdInput] = useState("");
  const [lookupResourceId, setLookupResourceId] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<ComplianceAssessment | null>(null);
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);

  const { data: overview, isLoading: overviewLoading } = useComplianceOverview();
  const { data: frameworks = [], isLoading: frameworksLoading } = useFrameworks();
  const { data: controls = [], isLoading: controlsLoading } = useFrameworkControls(selectedFrameworkId);
  const { data: failingControls = [], isLoading: failuresLoading } = useFailingControls(selectedFrameworkId);
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments(selectedFrameworkId);
  const { data: complianceFindingsResponse, isLoading: complianceFindingsLoading } = useFindings({
    findingType: "compliance_violation",
    status: "open",
    page: 1,
    pageSize: 100,
  });
  const { mutate: runAssessment, isPending: assessmentRunning } = useRunAssessment();
  const { mutate: toggleFramework } = useToggleFramework();
  const updateFindingStatus = useUpdateFindingStatus();

  useEffect(() => {
    if (!selectedFrameworkId && frameworks.length > 0) {
      const defaultFramework = frameworks.find((framework) => framework.isEnabled) ?? frameworks[0];
      setSelectedFrameworkId(defaultFramework.id);
    }
  }, [frameworks, selectedFrameworkId]);

  const selectedFramework = frameworks.find((framework) => framework.id === selectedFrameworkId);
  const enabledFrameworks = frameworks.filter((framework) => framework.isEnabled).length;
  const compliancePercent = overview?.compliancePercent ?? 0;
  const failingCount = overview?.failedControls ?? failingControls.length;
  const passingCount = overview?.passedControls ?? 0;
  const totalControls = overview?.totalControls ?? controls.length;
  const complianceFindings = complianceFindingsResponse?.data ?? [];
  const selectedFinding = complianceFindings.find((finding) => finding.id === selectedFindingId) ?? complianceFindings[0] ?? null;

  const updateSelectedFindingStatus = (status: FindingStatus) => {
    if (!selectedFinding) return;
    updateFindingStatus.mutate(
      { id: selectedFinding.id, status },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${formatFindingLabel(status)}.` }),
        onError: (error: Error) => toast({ title: "Could not update finding", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleRunAssessment = () => {
    if (!selectedFrameworkId) {
      toast({ title: "No framework selected", description: "Select a framework before running an assessment.", variant: "destructive" });
      return;
    }

    runAssessment(selectedFrameworkId, {
      onSuccess: () => toast({ title: "Assessment started", description: "Compliance assessment is running in the background." }),
      onError: (error: Error) => toast({ title: "Assessment failed", description: error.message || "Could not start assessment.", variant: "destructive" }),
    });
  };

  const downloadAssessment = (assessment?: ComplianceAssessment) => {
    const rows = assessment
      ? [
          ["Framework", assessment.frameworkName],
          ["Assessment date", assessment.assessmentDate],
          ["Status", assessment.status],
          ["Compliance percent", assessment.compliancePercent],
          ["Passed controls", assessment.passedControls],
          ["Failed controls", assessment.failedControls],
          ["Total controls", assessment.totalControls],
        ]
      : [
          ["Framework", selectedFramework?.name || "All frameworks"],
          ["Compliance percent", compliancePercent],
          ["Passed controls", passingCount],
          ["Failed controls", failingCount],
          ["Total controls", totalControls],
        ];

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `infraudit-compliance-${assessment?.id || new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported", description: "The compliance CSV has been downloaded." });
  };

  const reviewFinding = (finding: AssessmentFinding) => {
    const normalizedFinding = complianceFindings.find((item) => {
      const target = `${item.ruleId ?? ""} ${item.externalId ?? ""} ${item.title}`.toLowerCase();
      return target.includes(finding.controlId.toLowerCase());
    });

    if (normalizedFinding) {
      setSelectedFindingId(normalizedFinding.id);
      setActiveTab("findings");
    } else {
      setActiveTab("controls");
    }

    toast({
      title: `Reviewing ${finding.controlId}`,
      description: normalizedFinding ? "Opening normalized audit evidence for this control." : finding.remediation || "Open the control details to review remediation guidance.",
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Compliance Readiness"
        description="Track enabled frameworks, failing controls, evidence lookup, and assessment exports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => downloadAssessment()} disabled={overviewLoading || !overview}>
              <Download className="h-4 w-4" />
              Export Evidence
            </Button>
            <Button className="gap-2" onClick={handleRunAssessment} disabled={assessmentRunning || !selectedFrameworkId}>
              <PlayCircle className={`h-4 w-4 ${assessmentRunning ? "animate-spin" : ""}`} />
              {assessmentRunning ? "Running" : "Run Assessment"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={ShieldCheck} label="Readiness score" value={`${compliancePercent}%`} tone={compliancePercent >= 80 ? "emerald" : compliancePercent >= 60 ? "amber" : "red"} helper="Across enabled frameworks" />
        <MetricTile icon={FileCheck2} label="Passing controls" value={passingCount} tone="emerald" helper={`${totalControls} total controls`} />
        <MetricTile icon={ShieldX} label="Failing controls" value={failingCount} tone="red" helper="Needs remediation" />
        <MetricTile icon={Fingerprint} label="Open violations" value={complianceFindings.length} tone="orange" helper={`${enabledFrameworks}/${frameworks.length} frameworks enabled`} />
      </div>

      <Card className="mt-6 rounded-lg">
        <CardHeader>
          <CardTitle>Audit Readiness</CardTitle>
          <CardDescription>{selectedFramework?.name ? `${selectedFramework.name} is selected for assessment review` : "Select a framework to inspect controls"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Overall readiness</span>
                  <span className="font-medium">{compliancePercent}%</span>
                </div>
                <Progress value={compliancePercent} />
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Selected Framework</p>
                <Select value={selectedFrameworkId} onValueChange={setSelectedFrameworkId}>
                  <SelectTrigger>
                    <SelectValue placeholder={frameworksLoading ? "Loading frameworks" : "Select framework"} />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((framework) => (
                      <SelectItem key={framework.id} value={framework.id}>
                        {framework.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFramework && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <ToneBadge value={selectedFramework.isEnabled ? "enabled" : "disabled"} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Controls</span>
                      <span>{controls.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <FailingControlsList
              findings={failingControls}
              isLoading={failuresLoading}
              onReview={reviewFinding}
              onViewAll={() => setActiveTab("findings")}
            />

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Audit Evidence Queue</p>
                  <p className="text-xs text-muted-foreground">Open normalized compliance violations</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("findings")}>
                  View All
                </Button>
              </div>
              {complianceFindingsLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading evidence...</p>
              ) : complianceFindings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No open compliance findings.</p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {complianceFindings.slice(0, 4).map((finding) => (
                    <FindingRow
                      key={finding.id}
                      finding={finding}
                      compact
                      selected={selectedFinding?.id === finding.id}
                      onSelect={() => {
                        setSelectedFindingId(finding.id);
                        setActiveTab("findings");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="readiness">Frameworks</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="mt-4">
          <FrameworkSelector
            frameworks={frameworks}
            selectedId={selectedFrameworkId}
            onSelect={setSelectedFrameworkId}
            onToggle={(id, enabled) => toggleFramework({ id, enabled })}
          />
        </TabsContent>

        <TabsContent value="controls" className="mt-4 space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Control Matrix</CardTitle>
              <CardDescription>Controls and remediation detail for the selected framework</CardDescription>
            </CardHeader>
            <CardContent>
              <ControlsTable controls={controls} isLoading={controlsLoading} onView={setSelectedControl} />
            </CardContent>
          </Card>
          {selectedControl && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>{selectedControl.controlId}: {selectedControl.title}</CardTitle>
                <CardDescription>{selectedControl.category}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Severity">
                  <ToneBadge value={selectedControl.severity} />
                </DetailRow>
                <DetailRow label="Remediation">{selectedControl.remediation || "No remediation guidance is available for this control."}</DetailRow>
                <div className="md:col-span-2">
                  <DetailRow label="Description">{selectedControl.description}</DetailRow>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Compliance Findings</CardTitle>
                <CardDescription>Policy-backed violations with stored resource evidence and lifecycle state</CardDescription>
              </CardHeader>
              <CardContent>
                {complianceFindingsLoading ? (
                  <EmptyPanel icon={FileText} title="Loading compliance findings" description="Fetching normalized audit evidence records." />
                ) : complianceFindings.length === 0 ? (
                  <EmptyPanel icon={ShieldCheck} title="No open compliance findings" description="Run an assessment or adjust filters in Security Findings to review closed records." />
                ) : (
                  <div className="divide-y rounded-lg border">
                    {complianceFindings.map((finding) => (
                      <FindingRow
                        key={finding.id}
                        finding={finding}
                        selected={selectedFinding?.id === finding.id}
                        onSelect={() => setSelectedFindingId(finding.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Audit Evidence Detail</CardTitle>
                <CardDescription>Control mapping, policy source, resource evidence, and remediation</CardDescription>
              </CardHeader>
              <CardContent>
                <FindingDetailPanel
                  finding={selectedFinding}
                  onStatusChange={updateSelectedFindingStatus}
                  isStatusPending={updateFindingStatus.isPending}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4 space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Resource Evidence Lookup</CardTitle>
              <CardDescription>Find compliance status and failing controls for a specific resource identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  setLookupResourceId(resourceIdInput.trim());
                }}
              >
                <Input
                  placeholder="Resource ID, ARN, instance ID, or cluster resource"
                  value={resourceIdInput}
                  onChange={(event) => setResourceIdInput(event.target.value)}
                />
                <Button type="submit" disabled={!resourceIdInput.trim()} className="gap-2">
                  <Search className="h-4 w-4" />
                  Lookup
                </Button>
              </form>
            </CardContent>
          </Card>
          {lookupResourceId ? (
            <ResourceCompliancePanel resourceId={lookupResourceId} />
          ) : (
            <EmptyPanel icon={Search} title="No resource selected" description="Enter a resource identifier to inspect compliance evidence." />
          )}
        </TabsContent>

        <TabsContent value="evidence" className="mt-4 space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>Past assessment runs and exportable evidence snapshots</CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentHistory
                assessments={assessments}
                isLoading={assessmentsLoading}
                onView={setSelectedAssessment}
                onExport={downloadAssessment}
              />
            </CardContent>
          </Card>
          {selectedAssessment && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>{selectedAssessment.frameworkName} assessment</CardTitle>
                <CardDescription>{selectedAssessment.assessmentDate}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow label="Status">
                  <ToneBadge value={selectedAssessment.status} />
                </DetailRow>
                <DetailRow label="Score">{selectedAssessment.compliancePercent}%</DetailRow>
                <DetailRow label="Passed">{selectedAssessment.passedControls}</DetailRow>
                <DetailRow label="Failed">{selectedAssessment.failedControls}</DetailRow>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
