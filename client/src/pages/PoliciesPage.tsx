import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  usePolicies, usePolicyTemplates, useCreatePolicy, useUpdatePolicy, useDeletePolicy,
  useGeneratePolicy, useEvaluatePolicies, usePolicyViolations, useUpdateViolationStatus,
} from "@/hooks/use-policies";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Scale, Plus, Sparkles, Play, Loader2, Trash2, CheckCircle2, XCircle,
} from "lucide-react";

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600 border-red-500/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

const categoryColors: Record<string, string> = {
  security: "bg-red-500/10 text-red-600",
  compliance: "bg-blue-500/10 text-blue-600",
  cost: "bg-green-500/10 text-green-600",
  custom: "bg-purple-500/10 text-purple-600",
};

export default function PoliciesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("policies");
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regoCode, setRegoCode] = useState("");
  const [category, setCategory] = useState("security");
  const [severity, setSeverity] = useState("medium");

  const { data: policies = [], isLoading } = usePolicies();
  const { data: templates = [] } = usePolicyTemplates();
  const { data: violations = [] } = usePolicyViolations(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const deleteMutation = useDeletePolicy();
  const generateMutation = useGeneratePolicy();
  const evaluateMutation = useEvaluatePolicies();
  const updateViolationMutation = useUpdateViolationStatus();

  const policyList = Array.isArray(policies) ? policies : [];
  const templateList = Array.isArray(templates) ? templates : [];
  const violationList = Array.isArray(violations) ? violations : [];
  const enabledCount = policyList.filter((p: any) => p.enabled).length;

  const handleCreate = () => {
    createMutation.mutate(
      { name, description, rego_code: regoCode, category, severity },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Policy created" });
          setCreateOpen(false);
          setName(""); setDescription(""); setRegoCode("");
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleAIGenerate = () => {
    generateMutation.mutate(aiDescription, {
      onSuccess: (data) => {
        setAiResult(data.rego_code);
        toast({ title: "Generated", description: "Rego policy generated. Review and save." });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleSaveAIPolicy = () => {
    setRegoCode(aiResult);
    setAiOpen(false);
    setCreateOpen(true);
  };

  const handleEnableTemplate = (tmpl: any) => {
    createMutation.mutate(
      { name: tmpl.name, description: tmpl.description, rego_code: tmpl.rego_code, category: tmpl.category, severity: tmpl.severity },
      {
        onSuccess: () => toast({ title: "Enabled", description: `Template "${tmpl.name}" enabled` }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleToggle = (policy: any) => {
    updateMutation.mutate(
      { id: policy.id, data: { enabled: !policy.enabled } },
      { onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }) }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Policies</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              OPA/Rego policy engine — enforce security, compliance, and cost rules
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" /> AI Generate</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>AI Policy Generator</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Describe the policy</Label>
                    <Textarea placeholder="e.g. Deny S3 buckets without encryption" value={aiDescription} onChange={e => setAiDescription(e.target.value)} rows={3} />
                  </div>
                  {aiResult && (
                    <div>
                      <Label>Generated Rego</Label>
                      <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono max-h-60 overflow-auto">{aiResult}</pre>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {aiResult ? (
                    <Button onClick={handleSaveAIPolicy}>Use This Policy</Button>
                  ) : (
                    <Button onClick={handleAIGenerate} disabled={generateMutation.isPending || !aiDescription}>
                      {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Policy</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="security">Security</SelectItem><SelectItem value="compliance">Compliance</SelectItem><SelectItem value="cost">Cost</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><Label>Severity</Label>
                        <Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
                  <div>
                    <Label>Rego Code</Label>
                    <Textarea className="font-mono text-sm" rows={10} value={regoCode} onChange={e => setRegoCode(e.target.value)} placeholder={"package infraudit\n\ndeny[msg] {\n  ...\n}"} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Policy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => evaluateMutation.mutate(undefined, {
              onSuccess: (data) => toast({ title: "Evaluation Complete", description: `${data.new_violations} new violations found` }),
              onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            })} disabled={evaluateMutation.isPending}>
              {evaluateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Evaluate All
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Policies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{policyList.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Enabled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{enabledCount}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Violations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{violationList.length}</div></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
          </TabsList>

          <TabsContent value="policies">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                ) : policyList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Scale className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No policies yet</p>
                    <p className="text-sm">Create a policy or enable a template to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Severity</TableHead><TableHead>Enabled</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {policyList.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.description}</div></TableCell>
                          <TableCell><Badge className={categoryColors[p.category] || ""}>{p.category}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={severityColors[p.severity] || ""}>{p.severity}</Badge></TableCell>
                          <TableCell><Switch checked={p.enabled} onCheckedChange={() => handleToggle(p)} /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id, {
                              onSuccess: () => toast({ title: "Deleted" }),
                            })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateList.map((tmpl: any, i: number) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                      <Badge className={categoryColors[tmpl.category] || ""}>{tmpl.category}</Badge>
                    </div>
                    <CardDescription className="text-xs">{tmpl.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={severityColors[tmpl.severity] || ""}>{tmpl.severity}</Badge>
                      <Button size="sm" onClick={() => handleEnableTemplate(tmpl)}>Enable</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="violations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Policy Violations</CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {violationList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mb-4 text-green-300" />
                    <p className="text-lg font-medium">No violations</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Resource</TableHead><TableHead>Violation</TableHead><TableHead>Severity</TableHead><TableHead>Status</TableHead><TableHead>Detected</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {violationList.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-sm">{v.resource_id}</TableCell>
                          <TableCell className="max-w-xs truncate">{v.violation_detail}</TableCell>
                          <TableCell><Badge variant="outline" className={severityColors[v.severity] || ""}>{v.severity}</Badge></TableCell>
                          <TableCell><Badge variant={v.status === "open" ? "destructive" : "secondary"}>{v.status}</Badge></TableCell>
                          <TableCell className="text-sm text-gray-500">{new Date(v.detected_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right space-x-1">
                            {v.status === "open" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => updateViolationMutation.mutate({ id: v.id, status: "resolved" })}>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => updateViolationMutation.mutate({ id: v.id, status: "ignored" })}>
                                  <XCircle className="h-4 w-4 text-gray-500" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
