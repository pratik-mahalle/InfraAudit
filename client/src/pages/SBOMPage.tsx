import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useSBOMReports, useGenerateSBOM, useDeleteSBOM } from "@/hooks/use-sbom";
import { api, type SBOMReport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DetailRow, EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
import { cn } from "@/lib/utils";
import { FileText, Download, Trash2, Loader2, Plus, Package, Boxes, ShieldCheck, Layers3 } from "lucide-react";

function reportResource(report: SBOMReport) {
  return (report as any).resourceId ?? report.resource_id;
}

function reportComponents(report: SBOMReport) {
  return (report as any).componentCount ?? report.component_count ?? 0;
}

function reportGeneratedAt(report: SBOMReport) {
  return (report as any).generatedAt ?? report.generated_at ?? report.created_at;
}

export default function SBOMPage() {
  const { toast } = useToast();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [image, setImage] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [format, setFormat] = useState("cyclonedx");

  const { data, isLoading } = useSBOMReports();
  const generateMutation = useGenerateSBOM();
  const deleteMutation = useDeleteSBOM();

  const reports = data?.data || [];
  const total = data?.totalItems || reports.length;
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;
  const cyclonedxCount = reports.filter((report) => report.format === "cyclonedx").length;
  const spdxCount = reports.filter((report) => report.format === "spdx" || report.format === "spdx-json").length;
  const componentTotal = reports.reduce((sum, report) => sum + reportComponents(report), 0);
  const resourceGroups = Object.entries(reports.reduce<Record<string, number>>((counts, report) => {
    const resource = reportResource(report) || "unknown";
    counts[resource] = (counts[resource] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
  const formatGroups = Object.entries(reports.reduce<Record<string, number>>((counts, report) => {
    counts[report.format] = (counts[report.format] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);

  const handleGenerate = () => {
    if (!image) {
      toast({ title: "Image required", description: "Enter a container image before generating an SBOM.", variant: "destructive" });
      return;
    }
    generateMutation.mutate(
      { resource_id: resourceId || image, image, format },
      {
        onSuccess: (report) => {
          toast({ title: "SBOM generated", description: "The bill of materials is ready for review." });
          setGenerateOpen(false);
          setSelectedReportId(report.id);
          setImage("");
          setResourceId("");
        },
        onError: (err: Error) => {
          toast({ title: "Generation failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleView = async (id: number) => {
    try {
      const report = await api.sbom.get(id);
      setViewContent(report.content);
    } catch {
      toast({ title: "Could not load SBOM", description: "Failed to load SBOM content.", variant: "destructive" });
    }
  };

  const deleteReport = (report: SBOMReport) => {
    deleteMutation.mutate(report.id, {
      onSuccess: () => {
        toast({ title: "SBOM deleted", description: `Report #${report.id} was removed.` });
        if (selectedReportId === report.id) setSelectedReportId(null);
      },
      onError: (err: Error) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="SBOM Supply Chain"
        description="Generate, inspect, and export software bills of materials for container images and runtime resources."
        actions={
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Generate SBOM</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate SBOM</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Container Image</Label>
                  <Input placeholder="e.g. nginx:latest" value={image} onChange={e => setImage(e.target.value)} />
                </div>
                <div>
                  <Label>Resource ID</Label>
                  <Input placeholder="Optional resource or service identifier" value={resourceId} onChange={e => setResourceId(e.target.value)} />
                </div>
                <div>
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cyclonedx">CycloneDX</SelectItem>
                      <SelectItem value="spdx">SPDX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                  {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={FileText} label="Reports" value={total} tone="blue" helper="Generated SBOM records" />
        <MetricTile icon={Boxes} label="Components" value={componentTotal} tone="orange" helper="Across stored reports" />
        <MetricTile icon={ShieldCheck} label="CycloneDX" value={cyclonedxCount} tone="emerald" helper="Audit friendly format" />
        <MetricTile icon={Layers3} label="SPDX" value={spdxCount} tone="slate" helper="License and package exchange" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Report Library</CardTitle>
            <CardDescription>Browse generated SBOMs by resource, image, format, and component count</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyPanel icon={Loader2} title="Loading SBOM reports" description="Fetching generated bill-of-materials records." />
            ) : reports.length === 0 ? (
              <EmptyPanel icon={Package} title="No SBOM reports yet" description="Generate an SBOM from a container image to start supply-chain review." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {reports.map((report) => {
                  const selected = selectedReport?.id === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className={cn(
                        "rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
                        selected && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{reportResource(report)}</p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">Report #{report.id}</p>
                        </div>
                        <ToneBadge value={report.format} tone="blue" />
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                        <span className="text-muted-foreground">Components</span>
                        <span className="font-semibold">{reportComponents(report)}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(reportGeneratedAt(report)).toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Selected SBOM</CardTitle>
              <CardDescription>Report detail, export, and raw evidence access</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedReport ? (
                <EmptyPanel icon={FileText} title="No report selected" description="Select a report from the library to inspect its content." />
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <ToneBadge value={selectedReport.format} tone="blue" />
                      <ToneBadge value={`${reportComponents(selectedReport)} components`} tone="slate" />
                    </div>
                    <h3 className="text-lg font-semibold">{reportResource(selectedReport)}</h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">Report #{selectedReport.id}</p>
                  </div>
                  <dl className="grid gap-4">
                    <DetailRow label="Generated">{new Date(reportGeneratedAt(selectedReport)).toLocaleString()}</DetailRow>
                    <DetailRow label="Format">{selectedReport.format.toUpperCase()}</DetailRow>
                    <DetailRow label="Components">{reportComponents(selectedReport)}</DetailRow>
                  </dl>
                  <div className="grid gap-2">
                    <Button className="gap-2" onClick={() => handleView(selectedReport.id)}>
                      <FileText className="h-4 w-4" />
                      View JSON
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => api.sbom.download(selectedReport.id)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => deleteReport(selectedReport)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                      Delete Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Coverage</CardTitle>
              <CardDescription>Where SBOM evidence is concentrated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formatGroups.map(([name, count]) => (
                <button key={name} type="button" onClick={() => setFormat(name)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                  <span className="text-sm uppercase">{name}</span>
                  <ToneBadge value={count} tone="blue" />
                </button>
              ))}
              {resourceGroups.slice(0, 4).map(([resource, count]) => (
                <button key={resource} type="button" onClick={() => setResourceId(resource)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                  <span className="truncate text-sm">{resource}</span>
                  <ToneBadge value={count} tone="slate" />
                </button>
              ))}
              {reports.length === 0 && <p className="text-sm text-muted-foreground">No coverage signals yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>SBOM Content</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-muted p-4 text-xs">
            {viewContent ? (() => { try { return JSON.stringify(JSON.parse(viewContent), null, 2); } catch { return viewContent; } })() : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
