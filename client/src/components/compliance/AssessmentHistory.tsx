import React from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceAssessment } from '@/types';
import { Download, Eye } from "lucide-react";

interface AssessmentHistoryProps {
    assessments: ComplianceAssessment[];
    isLoading: boolean;
    onView: (assessment: ComplianceAssessment) => void;
    onExport: (assessment: ComplianceAssessment) => void;
}

export function AssessmentHistory({ assessments, isLoading, onView, onExport }: AssessmentHistoryProps) {
    if (isLoading) {
        return <div className="text-center p-4">Loading history...</div>;
    }

    return (
        <DataTable value={assessments} emptyMessage="No past assessments found." stripedRows size="small" responsiveLayout="scroll">
            <Column header="Date" body={(a: ComplianceAssessment) => <div className="font-medium">{new Date(a.assessmentDate).toLocaleDateString()}<div className="text-xs text-muted-foreground">{new Date(a.assessmentDate).toLocaleTimeString()}</div></div>} />
            <Column field="frameworkName" header="Framework" />
            <Column header="Score" body={(a: ComplianceAssessment) => <span className={`font-bold ${a.compliancePercent >= 90 ? "text-green-600" : a.compliancePercent >= 70 ? "text-yellow-600" : "text-red-600"}`}>{a.compliancePercent}%</span>} />
            <Column header="Controls (Pass/Fail)" body={(a: ComplianceAssessment) => <span className="text-xs"><span className="text-green-600">{a.passedControls} pass</span> / <span className="text-red-600">{a.failedControls} fail</span></span>} />
            <Column header="Status" body={(a: ComplianceAssessment) => <Badge variant={a.status === "completed" ? "outline" : "secondary"}>{a.status}</Badge>} />
            <Column header="Actions" body={(a: ComplianceAssessment) => <div className="flex gap-1"><Button variant="ghost" size="icon" title="View Details" onClick={() => onView(a)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Export Report" onClick={() => onExport(a)}><Download className="h-4 w-4" /></Button></div>} />
        </DataTable>
    );
}
