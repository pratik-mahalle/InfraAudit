import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  usePolicies, usePolicyTemplates, useCreatePolicy, useUpdatePolicy, useDeletePolicy,
  useGeneratePolicy, useEvaluatePolicies, usePolicyViolations, useUpdateViolationStatus,
} from "@/hooks/use-policies";
import { useAIProviders } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DetailRow, EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
import {
  Scale, Plus, Sparkles, Play, Loader2, Trash2, CheckCircle2, XCircle, ShieldAlert, Library, FileCode2,
} from "lucide-react";

const categories = ["security", "compliance", "cost", "custom"];
const severities = ["critical", "high", "medium", "low"];

function policyRego(policy: any) {
  return policy.regoCode ?? policy.rego_code ?? "";
}

function policyCreatedAt(policy: any) {
  return policy.createdAt ?? policy.created_at;
}

function policyUpdatedAt(policy: any) {
  return policy.updatedAt ?? policy.updated_at;
}

function violationPolicyId(violation: any) {
  return violation.policyId ?? violation.policy_id;
}

function violationResourceId(violation: any) {
  return violation.resourceId ?? violation.resource_id;
}

function violationDetail(violation: any) {
  return violation.violationDetail ?? violation.violation_detail ?? "";
}

function violationDetectedAt(violation: any) {
  return violation.detectedAt ?? violation.detected_at;
}

function templateRego(template: any) {
  return template.regoCode ?? template.rego_code ?? "";
}

export default function PoliciesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("policies");
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regoCode, setRegoCode] = useState("");
  const [category, setCategory] = useState("security");
  const [severity, setSeverity] = useState("medium");

  const { data: policies = [], isLoading } = usePolicies();
  const { data: templates = [] } = usePolicyTemplates();
  const { data: violations = [] } = usePolicyViolations(statusFilter !== "all" ? { status: statusFilter } : undefined);
  const { data: aiProviders = [], isLoading: aiProvidersLoading, isError: aiProvidersError } = useAIProviders();
  const aiAvailable = aiProviders.length > 0;

  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const deleteMutation = useDeletePolicy();
  const generateMutation = useGeneratePolicy();
  const evaluateMutation = useEvaluatePolicies();
  const updateViolationMutation = useUpdateViolationStatus();

  const policyList = Array.isArray(policies) ? policies : [];
  const templateList = Array.isArray(templates) ? templates : [];
  const violationList = Array.isArray(violations) ? violations : [];
  const enabledCount = policyList.filter((policy: any) => policy.enabled).length;
  const selectedPolicy = policyList.find((policy: any) => policy.id === selectedPolicyId) ?? policyList[0] ?? null;
  const selectedViolation = violationList.find((violation: any) => violation.id === selectedViolationId) ?? violationList[0] ?? null;
  const openViolations = violationList.filter((violation: any) => violation.status === "open");
  const policyCategories = categories.map((item) => ({
    category: item,
    count: policyList.filter((policy: any) => policy.category === item).length,
  })).filter((item) => item.count > 0);
  const severityMix = severities.map((item) => ({
    severity: item,
    count: violationList.filter((violation: any) => violation.severity === item).length,
  })).filter((item) => item.count > 0);
  const violationLanes = [
    { label: "Open", status: "open", items: violationList.filter((violation: any) => violation.status === "open"), tone: "red" as const },
    { label: "Resolved", status: "resolved", items: violationList.filter((violation: any) => violation.status === "resolved"), tone: "emerald" as const },
    { label: "Ignored", status: "ignored", items: violationList.filter((violation: any) => violation.status === "ignored"), tone: "slate" as const },
  ].filter((lane) => lane.items.length > 0);

  const handleCreate = () => {
    createMutation.mutate(
      { name, description, rego_code: regoCode, category, severity },
      {
        onSuccess: (policy: any) => {
          toast({ title: "Policy created", description: "The policy is ready for evaluation." });
          setCreateOpen(false);
          setSelectedPolicyId(policy.id);
          setName("");
          setDescription("");
          setRegoCode("");
        },
        onError: (err: Error) => toast({ title: "Create failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleAIGenerate = () => {
    if (aiProvidersError) {
      toast({ title: "AI status unavailable", description: "InfraAudit could not verify AI provider availability.", variant: "destructive" });
      return;
    }
    if (!aiAvailable) {
      toast({ title: "AI unavailable", description: "No AI provider is configured for this deployment.", variant: "destructive" });
      return;
    }
    generateMutation.mutate(aiDescription, {
      onSuccess: (data) => {
        setAiResult(data.regoCode);
        toast({ title: "Policy drafted", description: "Review the generated Rego before saving." });
      },
      onError: (err: Error) => toast({ title: "Generation failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleSaveAIPolicy = () => {
    setRegoCode(aiResult);
    setAiOpen(false);
    setCreateOpen(true);
  };

  const handleEnableTemplate = (tmpl: any) => {
    createMutation.mutate(
      { name: tmpl.name, description: tmpl.description, rego_code: templateRego(tmpl), category: tmpl.category, severity: tmpl.severity },
      {
        onSuccess: (policy: any) => {
          setSelectedPolicyId(policy.id);
          toast({ title: "Template enabled", description: tmpl.name });
        },
        onError: (err: Error) => toast({ title: "Template failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleToggle = (policy: any) => {
    updateMutation.mutate(
      { id: policy.id, data: { enabled: !policy.enabled } },
      { onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }) }
    );
  };

  const updateViolation = (id: number, nextStatus: string) => {
    updateViolationMutation.mutate(
      { id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Violation updated", description: `Status changed to ${nextStatus}.` }),
        onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  const policyName = (policyID: number) => policyList.find((policy: any) => policy.id === policyID)?.name ?? `Policy #${policyID}`;

  return (
    <DashboardLayout>
      <PageHeader
        title="Policy Control Room"
        description="Manage OPA/Rego policies, enable templates, evaluate resources, and close policy violations."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> AI Generate</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Draft Policy with AI</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {!aiProvidersLoading && aiProvidersError && (
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                      InfraAudit could not verify AI provider availability.
                    </p>
                  )}
                  {!aiProvidersLoading && !aiProvidersError && !aiAvailable && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                      No AI provider is configured for this deployment.
                    </p>
                  )}
                  <div>
                    <Label>Describe the policy</Label>
                    <Textarea placeholder="e.g. Deny S3 buckets without encryption" value={aiDescription} onChange={event => setAiDescription(event.target.value)} rows={3} />
                  </div>
                  {aiResult && (
                    <div>
                      <Label>Generated Rego</Label>
                      <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">{aiResult}</pre>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {aiResult ? (
                    <Button onClick={handleSaveAIPolicy}>Use This Policy</Button>
                  ) : (
                    <Button onClick={handleAIGenerate} disabled={generateMutation.isPending || aiProvidersLoading || aiProvidersError || !aiAvailable || !aiDescription}>
                      {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New Policy</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>Name</Label><Input value={name} onChange={event => setName(event.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select value={severity} onValueChange={setSeverity}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div><Label>Description</Label><Input value={description} onChange={event => setDescription(event.target.value)} /></div>
                  <div>
                    <Label>Rego Code</Label>
                    <Textarea className="font-mono text-sm" rows={10} value={regoCode} onChange={event => setRegoCode(event.target.value)} placeholder={"package infraudit\n\ndeny[msg] {\n  ...\n}"} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createMutation.isPending || !name || !regoCode}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Policy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2" onClick={() => evaluateMutation.mutate(undefined, {
              onSuccess: (data: any) => toast({ title: "Evaluation complete", description: `${data.newViolations ?? data.new_violations ?? 0} new violations found.` }),
              onError: (err: Error) => toast({ title: "Evaluation failed", description: err.message, variant: "destructive" }),
            })} disabled={evaluateMutation.isPending}>
              {evaluateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Evaluate All
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Scale} label="Policies" value={policyList.length} tone="blue" helper={`${enabledCount} enabled`} />
        <MetricTile icon={ShieldAlert} label="Open violations" value={openViolations.length} tone="red" helper={`${violationList.length} total`} />
        <MetricTile icon={Library} label="Templates" value={templateList.length} tone="slate" helper="Ready-made controls" />
        <MetricTile icon={FileCode2} label="AI providers" value={aiProviders.length} tone={aiAvailable ? "emerald" : "amber"} helper={aiAvailable ? "Drafting enabled" : "Drafting unavailable"} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Policy Mix</CardTitle>
            <CardDescription>Enabled coverage by policy category</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {policyCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No policy categories yet.</p>
            ) : policyCategories.map((item) => (
              <button key={item.category} type="button" onClick={() => setTab("policies")} className="rounded-lg border p-3 text-left hover:bg-muted/40">
                <p className="text-xs capitalize text-muted-foreground">{item.category}</p>
                <p className="mt-1 text-lg font-semibold">{item.count}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Violation Severity</CardTitle>
            <CardDescription>Current policy failure pressure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {severityMix.length === 0 ? (
              <p className="text-sm text-muted-foreground">No violation severity data.</p>
            ) : severityMix.map((item) => (
              <button key={item.severity} type="button" onClick={() => {
                setTab("violations");
                setStatusFilter("all");
              }} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                <ToneBadge value={item.severity} />
                <span className="text-sm font-semibold">{item.count}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Policy Registry</CardTitle>
                <CardDescription>{policyList.length} policies available for evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <EmptyPanel icon={Loader2} title="Loading policies" description="Fetching OPA policy registry." />
                ) : policyList.length === 0 ? (
                  <EmptyPanel icon={Scale} title="No policies yet" description="Create a policy or enable a template to start policy evaluation." />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {policyList.map((policy: any) => (
                      <button
                        key={policy.id}
                        type="button"
                        onClick={() => setSelectedPolicyId(policy.id)}
                        className={`rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 ${selectedPolicy?.id === policy.id ? "border-primary/50 bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-semibold">{policy.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{policy.description}</p>
                          </div>
                          <Switch checked={policy.enabled} onCheckedChange={() => handleToggle(policy)} onClick={(event) => event.stopPropagation()} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <ToneBadge value={policy.category} tone="blue" />
                          <ToneBadge value={policy.severity} />
                          <ToneBadge value={policy.enabled ? "enabled" : "disabled"} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Policy Detail</CardTitle>
                <CardDescription>Selected rule, lifecycle, and source preview</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPolicy ? (
                  <EmptyPanel icon={Scale} title="No policy selected" description="Select a policy to inspect Rego and actions." />
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <ToneBadge value={selectedPolicy.category} tone="blue" />
                        <ToneBadge value={selectedPolicy.severity} />
                        <ToneBadge value={selectedPolicy.enabled ? "enabled" : "disabled"} />
                      </div>
                      <h3 className="text-lg font-semibold">{selectedPolicy.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedPolicy.description}</p>
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Created">{new Date(policyCreatedAt(selectedPolicy)).toLocaleDateString()}</DetailRow>
                      <DetailRow label="Updated">{new Date(policyUpdatedAt(selectedPolicy)).toLocaleDateString()}</DetailRow>
                    </dl>
                    <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs">{policyRego(selectedPolicy)}</pre>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleToggle(selectedPolicy)}>
                        {selectedPolicy.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(selectedPolicy.id, {
                        onSuccess: () => toast({ title: "Policy deleted", description: selectedPolicy.name }),
                      })} disabled={deleteMutation.isPending}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templateList.map((tmpl: any, index: number) => (
              <Card key={`${tmpl.name}-${index}`} className="rounded-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{tmpl.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">{tmpl.description}</CardDescription>
                    </div>
                    <ToneBadge value={tmpl.category} tone="blue" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <ToneBadge value={tmpl.severity} />
                    <Button size="sm" onClick={() => handleEnableTemplate(tmpl)} disabled={createMutation.isPending}>Enable</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {templateList.length === 0 && <EmptyPanel icon={Library} title="No templates available" description="Policy templates were not returned by the API." />}
          </div>
        </TabsContent>

        <TabsContent value="violations" className="mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setStatusFilter("open")}>Open</Button>
            <Button size="sm" variant="outline" onClick={() => setStatusFilter("all")}>All</Button>
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Violation Board</CardTitle>
                <CardDescription>{violationList.length} policy violations in the current view</CardDescription>
              </CardHeader>
              <CardContent>
                {violationList.length === 0 ? (
                  <EmptyPanel icon={CheckCircle2} title="No violations" description="Policy evaluation has not found violations for this filter." />
                ) : (
                  <div className="grid gap-3 lg:grid-cols-3">
                    {violationLanes.map((lane) => (
                      <section key={lane.status} className="rounded-lg border bg-muted/20 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{lane.label}</h3>
                          <ToneBadge value={lane.items.length} tone={lane.tone} />
                        </div>
                        <div className="space-y-2">
                          {lane.items.map((violation: any) => (
                            <button
                              key={violation.id}
                              type="button"
                              onClick={() => setSelectedViolationId(violation.id)}
                              className={`w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 ${selectedViolation?.id === violation.id ? "border-primary/50 bg-primary/5" : ""}`}
                            >
                              <div className="flex flex-wrap gap-2">
                                <ToneBadge value={violation.severity} />
                                <ToneBadge value={violation.status} />
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm font-medium">{policyName(violationPolicyId(violation))}</p>
                              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{violationResourceId(violation)}</p>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Violation Detail</CardTitle>
                <CardDescription>Resource evidence and disposition actions</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedViolation ? (
                  <EmptyPanel icon={ShieldAlert} title="No violation selected" description="Select a violation to resolve or ignore it." />
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <ToneBadge value={selectedViolation.severity} />
                      <ToneBadge value={selectedViolation.status} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{policyName(violationPolicyId(selectedViolation))}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{violationDetail(selectedViolation)}</p>
                    </div>
                    <dl className="grid gap-4">
                      <DetailRow label="Resource"><span className="font-mono text-xs">{violationResourceId(selectedViolation)}</span></DetailRow>
                      <DetailRow label="Detected">{new Date(violationDetectedAt(selectedViolation)).toLocaleString()}</DetailRow>
                    </dl>
                    {selectedViolation.status === "open" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => updateViolation(selectedViolation.id, "resolved")} disabled={updateViolationMutation.isPending}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateViolation(selectedViolation.id, "ignored")} disabled={updateViolationMutation.isPending}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Ignore
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
