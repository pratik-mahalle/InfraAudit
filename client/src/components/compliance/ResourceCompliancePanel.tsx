import { useState } from "react";
import { useResourceCompliance } from "@/hooks/use-compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";

const statusBadge = (status: string) => {
  switch (status) {
    case "passed":
      return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    default:
      return <Badge variant="secondary">Not Checked</Badge>;
  }
};

const severityColor = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "text-red-600 font-semibold";
    case "high":
      return "text-orange-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-blue-600";
    default:
      return "text-muted-foreground";
  }
};

const overallIcon = (status: string) => {
  switch (status) {
    case "compliant":
      return <ShieldCheck className="h-8 w-8 text-green-500" />;
    case "partial":
      return <ShieldAlert className="h-8 w-8 text-yellow-500" />;
    default:
      return <ShieldX className="h-8 w-8 text-red-500" />;
  }
};

interface ResourceCompliancePanelProps {
  resourceId: string;
}

export function ResourceCompliancePanel({ resourceId }: ResourceCompliancePanelProps) {
  const { data: status, isLoading } = useResourceCompliance(resourceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Loading compliance data...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No compliance data available for this resource.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            {overallIcon(status.overallStatus)}
            <div>
              <p className="text-2xl font-bold">{status.score.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground capitalize">
                {status.overallStatus.replace("_", " ")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{status.totalControls}</p>
            <p className="text-sm text-muted-foreground">Total Controls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{status.passedControls}</p>
            <p className="text-sm text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{status.failedControls}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Control statuses table */}
      <Card>
        <CardHeader>
          <CardTitle>Control Status</CardTitle>
        </CardHeader>
        <CardContent>
          {status.controlStatuses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No controls evaluated.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.controlStatuses.map((cs) => (
                  <TableRow key={`${cs.frameworkId}-${cs.controlId}`}>
                    <TableCell className="font-mono text-sm">{cs.controlId}</TableCell>
                    <TableCell>{cs.title}</TableCell>
                    <TableCell>{statusBadge(cs.status)}</TableCell>
                    <TableCell>
                      <span className={severityColor(cs.severity)}>
                        {cs.severity || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {cs.reason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
