import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        </div>
      </CardHeader>
      <CardContent>
        <DataTable value={drifts} loading={isLoading} emptyMessage="No security drifts detected." stripedRows size="small" responsiveLayout="scroll">
          <Column field="id" header="Resource" body={(drift: SecurityDrift) => <span className="font-medium">{drift.id}</span>} />
          <Column field="driftType" header="Type" />
          <Column field="severity" header="Severity" body={(drift: SecurityDrift) => <span className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityBgColor(drift.severity)} ${getSeverityColor(drift.severity)}`}>{drift.severity.charAt(0).toUpperCase() + drift.severity.slice(1)}</span>} />
          <Column field="detectedAt" header="Detected" body={(drift: SecurityDrift) => formatTimeAgo(drift.detectedAt)} />
          <Column header="Status" body={(drift: SecurityDrift) => <Button variant="ghost" size="sm" onClick={() => handleRemediateClick(drift.id)}>Remediate</Button>} />
        </DataTable>
        <div className="mt-3 flex justify-center">
          <a href="/security" className="text-primary text-sm font-medium hover:underline">
            View all security drifts
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
