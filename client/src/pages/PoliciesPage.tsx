import { useState } from "react";
import { CheckCircle2, FileCode2, Loader2, Plus, Play, Sparkles, X } from "lucide-react";
import {
  usePolicies, usePolicyTemplates, useCreatePolicy, useUpdatePolicy, useDeletePolicy,
  useGeneratePolicy, useEvaluatePolicies, usePolicyViolations, useUpdateViolationStatus,
} from "@/hooks/use-policies";
import { useAIProviders } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SocBadge, SocButton, SocPanel, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

const categories = ["security", "compliance", "cost", "custom"];
const severities = ["critical", "high", "medium", "low"];

function policyRego(policy: any) {
  return policy?.regoCode ?? policy?.rego_code ?? "";
}

function policyUpdatedAt(policy: any) {
  return policy?.updatedAt ?? policy?.updated_at;
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

function templateRego(template: any) {
  return template.regoCode ?? template.rego_code ?? "";
}

function severityTone(severity?: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  if (severity === "low") return "blue" as const;
  return "slate" as const;
}

export default function PoliciesPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regoCode, setRegoCode] = useState("");
  const [category, setCategory] = useState("security");
  const [severity, setSeverity] = useState("medium");

  const { data: policies = [], isLoading } = usePolicies();
  const { data: templates = [] } = usePolicyTemplates();
  const { data: violations = [] } = usePolicyViolations();
  const { data: aiProviders = [], isLoading: aiProvidersLoading, isError: aiProvidersError } = useAIProviders();
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const deleteMutation = useDeletePolicy();
  const generateMutation = useGeneratePolicy();
  const evaluateMutation = useEvaluatePolicies();
  const updateViolationMutation = useUpdateViolationStatus();
  const aiAvailable = aiProviders.length > 0;

  const policyList = Array.isArray(policies) ? policies : [];
  const templateList = Array.isArray(templates) ? templates : [];
  const violationList = Array.isArray(violations) ? violations : [];
  const enabledCount = policyList.filter((policy: any) => policy.enabled).length;
  const openViolations = violationList.filter((violation: any) => violation.status === "open");
  const selectedPolicy = policyList.find((policy: any) => policy.id === selectedPolicyId) ?? policyList[0] ?? null;
  const selectedViolation = violationList.find((violation: any) => violation.id === selectedViolationId) ?? violationList[0] ?? null;
  const policyName = (policyID: number) => policyList.find((policy: any) => policy.id === policyID)?.name ?? `Policy #${policyID}`;

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
      },
    );
  };

  const handleAIGenerate = () => {
    if (aiProvidersError || !aiAvailable) {
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

  const handleEnableTemplate = (tmpl: any) => {
    createMutation.mutate(
      { name: tmpl.name, description: tmpl.description, rego_code: templateRego(tmpl), category: tmpl.category, severity: tmpl.severity },
      {
        onSuccess: (policy: any) => {
          setSelectedPolicyId(policy.id);
          toast({ title: "Template enabled", description: tmpl.name });
        },
        onError: (err: Error) => toast({ title: "Template failed", description: err.message, variant: "destructive" }),
      },
    );
  };

  const handleToggle = (policy: any) => {
    updateMutation.mutate({ id: policy.id, data: { enabled: !policy.enabled } });
  };

  const updateViolation = (id: number, nextStatus: string) => {
    updateViolationMutation.mutate(
      { id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Violation updated", description: `Status changed to ${nextStatus}.` }),
        onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
      },
    );
  };

  return (
    <SocWorkspace section="Governance / Policies" title="Policy Control Room" counts={{ policies: policyList.length }}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Governance · Policy Control Room</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">OPA / Rego Policy Registry</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <SocButton variant="ghost" onClick={() => evaluateMutation.mutate(undefined, {
            onSuccess: (data: any) => toast({ title: "Evaluation complete", description: `${data.newViolations ?? data.new_violations ?? 0} new violations found.` }),
            onError: (err: Error) => toast({ title: "Evaluation failed", description: err.message, variant: "destructive" }),
          })} disabled={evaluateMutation.isPending}>
            {evaluateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Evaluate All
          </SocButton>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><SocButton><Plus className="h-4 w-4" /> New Policy</SocButton></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2"><div><Label>Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label>Description</Label><Input value={description} onChange={(event) => setDescription(event.target.value)} /></div></div>
                <div className="grid gap-3 sm:grid-cols-2"><div><Label>Category</Label><select className="h-10 w-full rounded border bg-background px-3" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div><Label>Severity</Label><select className="h-10 w-full rounded border bg-background px-3" value={severity} onChange={(event) => setSeverity(event.target.value)}>{severities.map((item) => <option key={item}>{item}</option>)}</select></div></div>
                <div><Label>Rego Code</Label><Textarea rows={10} className="font-mono" value={regoCode} onChange={(event) => setRegoCode(event.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={handleCreate} disabled={createMutation.isPending || !name || !regoCode}>Create Policy</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.85fr)]">
        <SocPanel title="Policy Registry" actions={<input className="h-9 rounded border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground" placeholder="filter policies..." />}>
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-border font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Violations</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Enabled</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 font-mono text-sm text-muted-foreground">Loading policies...</td></tr>
                ) : policyList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-sm text-muted-foreground">No policies yet. Create one or enable a template.</td></tr>
                ) : policyList.map((policy: any) => (
                  <tr key={policy.id} onClick={() => setSelectedPolicyId(policy.id)} className={cn("cursor-pointer hover:bg-muted/60", selectedPolicy?.id === policy.id && "bg-primary/10")}>
                    <td className="px-4 py-4"><p className="font-semibold text-foreground">{policy.name}</p><p className="font-mono text-xs text-muted-foreground">POL-{String(policy.id).padStart(3, "0")} · {policy.category}</p></td>
                    <td className="px-4 py-4 font-mono text-sm uppercase text-muted-foreground">{policy.category}</td>
                    <td className="px-4 py-4"><SocBadge tone={severityTone(policy.severity)}>{policy.severity}</SocBadge></td>
                    <td className="px-4 py-4 font-mono text-sm text-red-300">{violationList.filter((violation: any) => violationPolicyId(violation) === policy.id && violation.status === "open").length}</td>
                    <td className="px-4 py-4 font-mono text-sm text-muted-foreground">{policyUpdatedAt(policy) ? new Date(policyUpdatedAt(policy)).toLocaleDateString() : "unknown"}</td>
                    <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}><Switch checked={policy.enabled} onCheckedChange={() => handleToggle(policy)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SocPanel>

        <SocPanel
          title="Rego Editor"
          actions={
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild><SocButton variant="ghost"><Sparkles className="h-4 w-4" /> AI Generate</SocButton></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Draft Policy with AI</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {!aiProvidersLoading && (aiProvidersError || !aiAvailable) && <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">No AI provider is configured.</p>}
                  <Textarea placeholder="Describe the policy" value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} rows={3} />
                  {aiResult && <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">{aiResult}</pre>}
                </div>
                <DialogFooter>{aiResult ? <Button onClick={() => { setRegoCode(aiResult); setAiOpen(false); setCreateOpen(true); }}>Use This Policy</Button> : <Button onClick={handleAIGenerate} disabled={generateMutation.isPending || !aiDescription}>Generate</Button>}</DialogFooter>
              </DialogContent>
            </Dialog>
          }
        >
          <div className="p-4">
            {selectedPolicy ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">POL-{String(selectedPolicy.id).padStart(3, "0")} · OPA/Rego</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{selectedPolicy.name}</h2>
                  </div>
                  <SocBadge tone={severityTone(selectedPolicy.severity)}>{selectedPolicy.severity}</SocBadge>
                </div>
                <pre className="max-h-[430px] overflow-auto rounded border border-border bg-muted/40 p-4 text-sm text-foreground">{policyRego(selectedPolicy) || "No policy source available."}</pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SocButton onClick={() => evaluateMutation.mutate()} disabled={evaluateMutation.isPending}><Play className="h-4 w-4" /> Evaluate</SocButton>
                  <SocButton variant="ghost">Save version</SocButton>
                  <SocButton variant="danger" onClick={() => deleteMutation.mutate(selectedPolicy.id)} disabled={deleteMutation.isPending}>Delete</SocButton>
                </div>
              </>
            ) : (
              <div className="p-8 text-sm text-muted-foreground">Select a policy to inspect source.</div>
            )}
          </div>
        </SocPanel>
      </div>

      <SocPanel className="mt-4" eyebrow="Live Evaluations" title="Policy Violations" actions={<SocBadge tone={openViolations.length > 0 ? "orange" : "green"}>{openViolations.length} open</SocBadge>}>
        <div className="divide-y divide-border">
          {openViolations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No open policy violations.</div>
          ) : openViolations.map((violation: any) => (
            <button key={violation.id} type="button" onClick={() => setSelectedViolationId(violation.id)} className={cn("grid w-full gap-3 px-4 py-3 text-left hover:bg-muted/60 lg:grid-cols-[130px_90px_minmax(0,1fr)_minmax(0,280px)_80px_76px]", selectedViolation?.id === violation.id && "bg-primary/10")}>
              <span className="font-mono text-sm text-orange-300">VIO-{violation.id}</span>
              <SocBadge tone={severityTone(violation.severity)}>{violation.severity}</SocBadge>
              <span className="truncate text-sm text-foreground"><span className="font-mono text-blue-300">{policyName(violationPolicyId(violation))}</span> · {violationDetail(violation)}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{violationResourceId(violation)}</span>
              <span className="font-mono text-xs text-muted-foreground">{violation.status}</span>
              <span className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => updateViolation(violation.id, "resolved")} className="text-emerald-600 hover:text-emerald-700 dark:text-green-400 dark:hover:text-green-300"><CheckCircle2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => updateViolation(violation.id, "ignored")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </span>
            </button>
          ))}
        </div>
      </SocPanel>

      {templateList.length > 0 && (
        <SocPanel className="mt-4" eyebrow="Templates" title="Ready-made policies">
          <div className="grid gap-3 p-3 md:grid-cols-3">
            {templateList.slice(0, 6).map((tmpl: any, index: number) => (
              <button key={`${tmpl.name}-${index}`} type="button" onClick={() => handleEnableTemplate(tmpl)} className="rounded border border-border bg-background p-3 text-left hover:bg-muted">
                <SocBadge tone={severityTone(tmpl.severity)}>{tmpl.severity}</SocBadge>
                <p className="mt-3 line-clamp-2 text-sm font-medium text-foreground">{tmpl.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </SocPanel>
      )}
    </SocWorkspace>
  );
}
