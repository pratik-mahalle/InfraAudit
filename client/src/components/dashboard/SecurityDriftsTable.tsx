import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo, getSeverityColor, getSeverityBgColor } from "@/lib/utils";
import { SecurityDrift } from "@/types";

interface SecurityDriftsTableProps {
  drifts: SecurityDrift[];
  isLoading?: boolean;
  onRemediateClick?: (id: number) => void;
}

export function SecurityDriftsTable({ 
  drifts, 
  isLoading = false,
  onRemediateClick
}: SecurityDriftsTableProps) {
  const { toast } = useToast();
  
  const handleRemediateClick = (id: number) => {
    if (onRemediateClick) {
      onRemediateClick(id);
    } else {
      toast({
        title: "Remediation started",
        description: `Remediation process started for drift #${id}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">Security Configuration Drifts</CardTitle>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Last 24 hours</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-[160px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  </TableRow>
                ))
              ) : drifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No security drifts detected.
                  </TableCell>
                </TableRow>
              ) : (
                drifts.map((drift) => (
                  <TableRow key={drift.id}>
                    <TableCell className="font-medium">{drift.id}</TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">{drift.driftType}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)} rounded-full`}>
                        {drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(drift.detectedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-primary hover:text-primary/80"
                        onClick={() => handleRemediateClick(drift.id)}
                      >
                        Remediate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex justify-center">
          <a href="/security" className="text-primary text-sm font-medium hover:underline">
            View all security drifts
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
