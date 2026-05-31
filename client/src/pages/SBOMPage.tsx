import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useSBOMReports, useGenerateSBOM, useDeleteSBOM } from "@/hooks/use-sbom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Download, Trash2, Loader2, Plus, Package } from "lucide-react";

export default function SBOMPage() {
  const { toast } = useToast();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [image, setImage] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [format, setFormat] = useState("cyclonedx");

  const { data, isLoading } = useSBOMReports();
  const generateMutation = useGenerateSBOM();
  const deleteMutation = useDeleteSBOM();

  const reports = data?.data || [];
  const total = data?.totalItems || 0;
  const cyclonedxCount = reports.filter(r => r.format === "cyclonedx").length;
  const spdxCount = reports.filter(r => r.format === "spdx" || r.format === "spdx-json").length;

  const handleGenerate = () => {
    if (!image) {
      toast({ title: "Error", description: "Image name is required", variant: "destructive" });
      return;
    }
    generateMutation.mutate(
      { resource_id: resourceId || image, image, format },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "SBOM generated successfully" });
          setGenerateOpen(false);
          setImage("");
          setResourceId("");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleView = async (id: number) => {
    try {
      const report = await api.sbom.get(id);
      setViewContent(report.content);
    } catch {
      toast({ title: "Error", description: "Failed to load SBOM content", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SBOM Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generate and manage Software Bill of Materials
            </p>
          </div>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Generate SBOM</Button>
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
                  <Label>Resource ID (optional)</Label>
                  <Input placeholder="e.g. my-service" value={resourceId} onChange={e => setResourceId(e.target.value)} />
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">CycloneDX</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{cyclonedxCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">SPDX</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{spdxCount}</div></CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Package className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No SBOM reports yet</p>
                <p className="text-sm">Generate your first SBOM to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Components</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">#{report.id}</TableCell>
                      <TableCell className="font-medium">{report.resource_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">{report.format}</Badge>
                      </TableCell>
                      <TableCell>{report.component_count}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(report.id)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => api.sbom.download(report.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(report.id, {
                          onSuccess: () => toast({ title: "Deleted", description: "SBOM report deleted" }),
                        })}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Content Dialog */}
        <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>SBOM Content</DialogTitle>
            </DialogHeader>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono">
              {viewContent ? (() => { try { return JSON.stringify(JSON.parse(viewContent), null, 2); } catch { return viewContent; } })() : ''}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
