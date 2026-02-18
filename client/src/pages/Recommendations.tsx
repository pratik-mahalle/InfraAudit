import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useRecommendations, useRecommendationSavings, useGenerateRecommendations, useUpdateRecommendation } from "@/hooks/use-recommendations";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Lightbulb, Zap, DollarSign, Search, CheckCircle2, XCircle, Loader2, TrendingDown
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Recommendation } from "@/lib/api";

export default function Recommendations() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: recsResponse, isLoading } = useRecommendations();
  const { data: savingsData } = useRecommendationSavings();
  const generateMutation = useGenerateRecommendations();
  const updateMutation = useUpdateRecommendation();

  const recommendations: Recommendation[] = Array.isArray(recsResponse) ? recsResponse : (recsResponse?.data || []);
  const totalSavings = savingsData?.totalSavings || recommendations.reduce((sum, r) => sum + (r.savings || 0), 0);

  // Filters
  const filtered = recommendations.filter(rec => {
    if (statusFilter !== "all" && rec.status !== statusFilter) return false;
    if (typeFilter !== "all" && rec.type !== typeFilter) return false;
    if (search && !rec.title.toLowerCase().includes(search.toLowerCase()) && !rec.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCount = recommendations.filter(r => r.status === "pending").length;
  const appliedCount = recommendations.filter(r => r.status === "applied").length;
  const types = Array.from(new Set(recommendations.map(r => r.type).filter(Boolean)));

  const handleApply = (id: number | string) => {
    updateMutation.mutate({ id: Number(id), data: { status: "applied" } }, {
      onSuccess: () => toast({ title: "Recommendation Applied", description: "The optimization has been marked as applied." }),
      onError: () => toast({ title: "Failed", description: "Could not apply recommendation.", variant: "destructive" }),
    });
  };

  const handleDismiss = (id: number | string) => {
    updateMutation.mutate({ id: Number(id), data: { status: "dismissed" } }, {
      onSuccess: () => toast({ title: "Dismissed", description: "Recommendation has been dismissed." }),
      onError: () => toast({ title: "Failed", description: "Could not dismiss recommendation.", variant: "destructive" }),
    });
  };

  const typeColor = (type: string) => {
    if (type.includes("cost")) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    if (type.includes("security")) return "bg-red-500/10 text-red-600 border-red-500/30";
    if (type.includes("performance")) return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    if (type.includes("compliance")) return "bg-violet-500/10 text-violet-600 border-violet-500/30";
    return "bg-gray-500/10 text-gray-600 border-gray-500/30";
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "high": return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "low": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/30";
    }
  };

  const formatType = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recommendations</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Optimization suggestions to improve cost, security, and performance
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Generate Recommendations
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600"><Lightbulb className="h-5 w-5" /></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{recommendations.length}</div>
              <div className="text-sm text-gray-500">Total Recommendations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Zap className="h-5 w-5" /></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{openCount}</div>
              <div className="text-sm text-gray-500">Open / Actionable</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{appliedCount}</div>
              <div className="text-sm text-gray-500">Applied</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600"><DollarSign className="h-5 w-5" /></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSavings)}</div>
              <div className="text-sm text-gray-500">Potential Savings</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search recommendations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>{filtered.length} recommendation{filtered.length !== 1 ? "s" : ""} found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lightbulb className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500">No recommendations found</p>
                <p className="text-xs text-gray-400 mt-1">Click "Generate Recommendations" to analyze your infrastructure</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium text-gray-900 dark:text-white">{rec.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rec.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", typeColor(rec.type))}>{formatType(rec.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", priorityColor(rec.priority))}>{rec.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        {(rec.savings ?? 0) > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <TrendingDown className="h-3.5 w-3.5" />
                            {formatCurrency(rec.savings)}/mo
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs",
                          rec.status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                          rec.status === "applied" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                          rec.status === "dismissed" && "bg-gray-500/10 text-gray-500 border-gray-500/30"
                        )}>
                          {rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleApply(rec.id)} disabled={updateMutation.isPending}>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDismiss(rec.id)} disabled={updateMutation.isPending}>
                              <XCircle className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
