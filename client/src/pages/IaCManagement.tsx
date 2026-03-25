import { useState, useRef } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useIaCDefinitions, useIaCDrifts, useIaCDriftSummary, useUploadIaC, useDetectIaCDrift, useDeleteIaCDefinition } from "@/hooks/use-iac";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCode, Upload, Search, Loader2, Zap, Trash2, AlertTriangle, FileCheck, GitCompare, Files
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function IaCManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("definitions");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: definitions, isLoading: defsLoading } = useIaCDefinitions();
  const { data: driftsData, isLoading: driftsLoading } = useIaCDrifts();
  const { data: driftSummary } = useIaCDriftSummary();
  const uploadMutation = useUploadIaC();
  const detectDriftMutation = useDetectIaCDrift();
  const deleteMutation = useDeleteIaCDefinition();

  const defsList = Array.isArray(definitions) ? definitions : [];
  const driftsList = Array.isArray(driftsData) ? driftsData : (driftsData as any)?.data || [];

  const filteredDefs = defsList.filter((d: any) => {
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase()) && !d.type?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredDrifts = driftsList.filter((d: any) => {
    if (search && !d.resourceId?.toLowerCase().includes(search.toLowerCase()) && !d.driftType?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: () => {
        toast({ title: "Upload Successful", description: `${file.name} has been parsed and stored.` });
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: (err: any) => {
        toast({ title: "Upload Failed", description: err.message || "Could not upload file.", variant: "destructive" });
      },
    });
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 border-red-500/30",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  };

  const typeIcons: Record<string, string> = {
    terraform: "Terraform",
    cloudformation: "CloudFormation",
    kubernetes: "Kubernetes",
  };

  const totalDefs = defsList.length;
  const totalDrifts = (driftSummary as any)?.total ?? driftsList.length;
  const criticalDrifts = (driftSummary as any)?.critical ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Infrastructure as Code</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload, parse, and detect drift in Terraform, CloudFormation, and Kubernetes manifests
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".tf,.json,.yaml,.yml,.template"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="gap-2"
            >
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload IaC File
            </Button>
            <Button
              onClick={() => detectDriftMutation.mutate(undefined, {
                onSuccess: () => toast({ title: "Drift Scan Started", description: "Comparing IaC definitions against live infrastructure..." }),
                onError: () => toast({ title: "Scan Failed", description: "Could not start IaC drift detection.", variant: "destructive" }),
              })}
              disabled={detectDriftMutation.isPending}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {detectDriftMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Detect IaC Drift
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 w-fit mb-3"><Files className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{totalDefs}</div>
              <div className="text-sm text-gray-500">IaC Definitions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-3"><FileCode className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{defsList.filter((d: any) => d.type === "terraform").length || 0}</div>
              <div className="text-sm text-gray-500">Terraform Files</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 w-fit mb-3"><GitCompare className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{totalDrifts}</div>
              <div className="text-sm text-gray-500">IaC Drifts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 w-fit mb-3"><AlertTriangle className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{criticalDrifts}</div>
              <div className="text-sm text-gray-500">Critical Drifts</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="definitions">Definitions</TabsTrigger>
            <TabsTrigger value="drifts">IaC Drifts</TabsTrigger>
          </TabsList>

          {/* Search */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardContent>
          </Card>

          {/* Definitions Tab */}
          <TabsContent value="definitions">
            <Card>
              <CardHeader>
                <CardTitle>IaC Definitions</CardTitle>
                <CardDescription>{filteredDefs.length} definition{filteredDefs.length !== 1 ? "s" : ""} uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                {defsLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : filteredDefs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileCode className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No IaC definitions uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Upload a Terraform, CloudFormation, or Kubernetes manifest to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDefs.map((def: any) => (
                        <TableRow key={def.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-violet-500" />
                              <span className="font-medium text-gray-900 dark:text-white">{def.name || def.fileName || "Unnamed"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {typeIcons[def.type] || def.type || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {def.resourceCount ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {def.createdAt ? new Date(def.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(String(def.id), {
                                onSuccess: () => toast({ title: "Deleted", description: "Definition removed." }),
                              })}
                              disabled={deleteMutation.isPending}
                            >
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
          </TabsContent>

          {/* Drifts Tab */}
          <TabsContent value="drifts">
            <Card>
              <CardHeader>
                <CardTitle>IaC Drift Results</CardTitle>
                <CardDescription>{filteredDrifts.length} drift{filteredDrifts.length !== 1 ? "s" : ""} found between IaC and live state</CardDescription>
              </CardHeader>
              <CardContent>
                {driftsLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : filteredDrifts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No IaC drifts detected</p>
                    <p className="text-xs text-gray-400 mt-1">Upload IaC files and run drift detection to compare against live infrastructure</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Drift Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Detected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDrifts.map((drift: any, idx: number) => (
                        <TableRow key={drift.id || idx}>
                          <TableCell>
                            <span className="font-medium text-gray-900 dark:text-white">{drift.resourceId || drift.resourceName || "Unknown"}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{drift.driftType || "configuration_change"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs", severityColors[drift.severity] || "")}>
                              {drift.severity || "low"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{drift.status || "detected"}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {drift.detectedAt ? new Date(drift.detectedAt).toLocaleDateString() : "—"}
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
