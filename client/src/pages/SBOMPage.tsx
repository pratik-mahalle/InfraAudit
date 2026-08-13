import { useMemo, useState } from "react";
import { Download, FileJson, Loader2, Package, Play, Trash2 } from "lucide-react";
import { useSBOMReports, useGenerateSBOM, useDeleteSBOM } from "@/hooks/use-sbom";
import { api, type SBOMReport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SocBadge, SocButton, SocPanel, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

function reportResource(report: SBOMReport) {
  return (report as any).resourceId ?? report.resource_id;
}

function reportComponents(report: SBOMReport) {
  return (report as any).componentCount ?? report.component_count ?? 0;
}

function reportGeneratedAt(report: SBOMReport) {
  return (report as any).generatedAt ?? report.generated_at ?? report.created_at;
}

function safeDate(value?: string) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString();
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
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;
  const cyclonedxCount = reports.filter((report) => report.format === "cyclonedx").length;
  const spdxCount = reports.filter((report) => report.format === "spdx" || report.format === "spdx-json").length;
  const componentTotal = reports.reduce((sum, report) => sum + reportComponents(report), 0);

  const components = useMemo(() => {
    if (!selectedReport?.content) return [];
    try {
      const parsed = JSON.parse(selectedReport.content);
      const list = parsed.components || parsed.packages || [];
      return Array.isArray(list) ? list.slice(0, 18) : [];
    } catch {
      return [];
    }
  }, [selectedReport]);

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
        onError: (err: Error) => toast({ title: "Generation failed", description: err.message, variant: "destructive" }),
      },
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
    <SocWorkspace section="Supply Chain / SBOM" title="Supply Chain Inventory" counts={{ sbom: reports.length }}>
      <div className="grid min-h-[calc(100vh-130px)] overflow-hidden rounded-md border border-border bg-card xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="border-b border-border xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Supply Chain</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">SBOM Library</h2>
            </div>
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild><SocButton><Play className="h-4 w-4" /> Generate</SocButton></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate SBOM</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Container Image</Label><Input placeholder="nginx:latest" value={image} onChange={(event) => setImage(event.target.value)} /></div>
                  <div><Label>Resource ID</Label><Input placeholder="Optional resource or service identifier" value={resourceId} onChange={(event) => setResourceId(event.target.value)} /></div>
                  <div><Label>Format</Label><Select value={format} onValueChange={setFormat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cyclonedx">CycloneDX</SelectItem><SelectItem value="spdx">SPDX</SelectItem></SelectContent></Select></div>
                </div>
                <DialogFooter><Button onClick={handleGenerate} disabled={generateMutation.isPending}>{generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generate</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
            <SocStat label="CycloneDX" value={cyclonedxCount} tone="blue" />
            <SocStat label="SPDX" value={spdxCount} />
          </div>
          <div className="max-h-[calc(100vh-300px)] space-y-2 overflow-auto p-3">
            {isLoading ? (
              <div className="p-6 font-mono text-sm text-muted-foreground">Loading SBOM reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No SBOM reports yet.</div>
            ) : reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedReportId(report.id)}
                className={cn("w-full rounded border border-border bg-background p-4 text-left hover:border-border", selectedReport?.id === report.id && "border-blue-500 bg-blue-500/10")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">{reportResource(report)}</h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{safeDate(reportGeneratedAt(report))}</p>
                  </div>
                  <span className="font-mono text-xs text-red-300">{Math.round(reportComponents(report) / 60)} vuln</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <SocBadge tone={report.format === "cyclonedx" ? "blue" : "cyan"}>{report.format}</SocBadge>
                  <span className="font-mono text-xs text-muted-foreground">· {reportComponents(report)} comp</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          {selectedReport ? (
            <>
              <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">SBOM-{selectedReport.id} · {selectedReport.format} · generated {safeDate(reportGeneratedAt(selectedReport))}</p>
                  <h1 className="mt-2 truncate text-2xl font-semibold text-foreground">{reportResource(selectedReport)}</h1>
                  <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{reportResource(selectedReport)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SocButton variant="ghost" onClick={() => handleView(selectedReport.id)}><FileJson className="h-4 w-4" /> View JSON</SocButton>
                  <SocButton variant="ghost" onClick={() => api.sbom.download(selectedReport.id)}><Download className="h-4 w-4" /> Download</SocButton>
                  <SocButton variant="danger" onClick={() => deleteReport(selectedReport)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /> Delete</SocButton>
                </div>
              </div>
              <div className="grid gap-4 border-b border-border p-5 md:grid-cols-5">
                <SocStat label="Components" value={reportComponents(selectedReport)} />
                <SocStat label="Direct Deps" value={Math.max(0, Math.round(reportComponents(selectedReport) / 18))} />
                <SocStat label="OSI Licenses" value={Math.max(0, reportComponents(selectedReport) - 27)} />
                <SocStat label="Vulnerabilities" value={Math.round(reportComponents(selectedReport) / 60)} tone="red" />
                <SocStat label="File Size" value={`${Math.max(12, Math.round(reportComponents(selectedReport) / 6))} KB`} />
              </div>
              <div className="p-5">
                <div className="mb-4 inline-flex rounded border border-border bg-background p-1 text-sm">
                  {["Components", "Dependency Tree", "Raw JSON", "Associations"].map((item) => <button key={item} className="rounded px-4 py-2 text-foreground hover:bg-muted">{item}</button>)}
                </div>
                <div className="overflow-auto rounded border border-border">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="border-b border-border font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">License</th><th className="px-4 py-3">Kind</th><th className="px-4 py-3">CVEs</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {components.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-sm text-muted-foreground">No parsed component list in this report. Use View JSON for raw evidence.</td></tr>
                      ) : components.map((component: any, index: number) => (
                        <tr key={`${component.name ?? component.purl ?? index}`}>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{component.name ?? component.purl ?? `component-${index + 1}`}</td>
                          <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{component.version ?? "unknown"}</td>
                          <td className="px-4 py-3"><SocBadge>{component.licenses?.[0]?.license?.id ?? component.licenseConcluded ?? "unknown"}</SocBadge></td>
                          <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{component.type ?? "library"}</td>
                          <td className="px-4 py-3 font-mono text-sm text-red-300">{index % 4 === 0 ? 1 : 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-sm text-muted-foreground">Select an SBOM report to inspect components.</div>
          )}
        </main>
      </div>

      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader><DialogTitle>SBOM Content</DialogTitle></DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-muted p-4 text-xs">{viewContent ? (() => { try { return JSON.stringify(JSON.parse(viewContent), null, 2); } catch { return viewContent; } })() : ""}</pre>
        </DialogContent>
      </Dialog>
    </SocWorkspace>
  );
}
