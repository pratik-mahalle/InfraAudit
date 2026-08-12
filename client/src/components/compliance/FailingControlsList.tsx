import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssessmentFinding } from '@/types';
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

interface FailingControlsListProps {
    findings: AssessmentFinding[];
    isLoading: boolean;
    onReview: (finding: AssessmentFinding) => void;
    onViewAll: () => void;
}

export function FailingControlsList({ findings, isLoading, onReview, onViewAll }: FailingControlsListProps) {
    if (isLoading) {
        return <div className="text-center p-4">Loading failing controls...</div>;
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const hasFailures = findings.length > 0;

    return (
        <Card className={`h-full ${hasFailures ? "border-red-200" : "border-emerald-200"}`}>
            <CardHeader className={`${hasFailures ? "bg-red-50/50" : "bg-emerald-50/60"} pb-2`}>
                <div className="flex justify-between items-center">
                    <CardTitle className={`${hasFailures ? "text-red-700" : "text-emerald-700"} flex items-center gap-2`}>
                        {hasFailures ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        {hasFailures ? "Failing Controls" : "Controls Passing"}
                    </CardTitle>
                    <div className="flex gap-2">
                        {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
                        {highCount > 0 && <Badge className="bg-orange-500 hover:bg-orange-600">{highCount} High</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {findings.length > 0 ? (
                    <div className="space-y-3">
                        {findings.slice(0, 5).map((f, i) => (
                            <div key={i} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold bg-gray-100 px-1 rounded">{f.controlId}</span>
                                        <span className="font-medium text-sm">{f.controlTitle}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Affected: {f.affectedCount} resources
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => onReview(f)}
                                >
                                    Review <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        ))}
                        {findings.length > 5 && (
                            <Button variant="link" className="w-full text-sm text-muted-foreground" onClick={onViewAll}>
                                View all {findings.length} failures
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-emerald-700">
                        <ShieldCheck className="mb-3 h-7 w-7" />
                        <p className="font-medium">No failing controls detected</p>
                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">Run an assessment to refresh evidence for the selected framework.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
