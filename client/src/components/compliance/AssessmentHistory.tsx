import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceAssessment } from '@/types';
import { Download, Eye } from "lucide-react";

interface AssessmentHistoryProps {
    assessments: ComplianceAssessment[];
    isLoading: boolean;
}

export function AssessmentHistory({ assessments, isLoading }: AssessmentHistoryProps) {
    if (isLoading) {
        return <div className="text-center p-4">Loading history...</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Framework</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Controls (Pass/Fail)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assessments.length > 0 ? (
                        assessments.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell className="font-medium">
                                    {new Date(a.assessmentDate).toLocaleDateString()}
                                    <div className="text-xs text-muted-foreground">{new Date(a.assessmentDate).toLocaleTimeString()}</div>
                                </TableCell>
                                <TableCell>{a.frameworkName}</TableCell>
                                <TableCell>
                                    <span className={`font-bold ${a.compliancePercent >= 90 ? 'text-green-600' :
                                            a.compliancePercent >= 70 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {a.compliancePercent}%
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-green-600">{a.passedControls} pass</span> /
                                        <span className="text-red-600">{a.failedControls} fail</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={a.status === 'completed' ? 'outline' : 'secondary'}>
                                        {a.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" title="View Details">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Export Report">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No past assessments found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
