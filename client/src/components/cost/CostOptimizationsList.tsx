import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostOptimization, OptimizationCoverage } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, Lightbulb, Sparkles, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type WorkflowStatus = 'acknowledged' | 'planned' | 'applied' | 'verified' | 'dismissed';

interface CostOptimizationsListProps {
    optimizations: CostOptimization[];
    total?: number;
    isLoading: boolean;
    isError?: boolean;
    isGenerating?: boolean;
    updatingId?: string;
    canGenerate?: boolean;
    coverage?: OptimizationCoverage[];
    onGenerate?: () => void;
    onUpdate?: (optimization: CostOptimization, status: WorkflowStatus, notes?: string) => void;
    onRetry?: () => void;
}

const statusLabel: Record<CostOptimization['status'], string> = {
    new: 'New', acknowledged: 'Acknowledged', planned: 'Planned', applied: 'Applied',
    verified: 'Verified', dismissed: 'Dismissed', expired: 'Expired',
};

function nextActions(status: CostOptimization['status']): { label: string; status: WorkflowStatus; primary?: boolean }[] {
    switch (status) {
        case 'new':
            return [{ label: 'Acknowledge', status: 'acknowledged' }, { label: 'Plan', status: 'planned', primary: true }, { label: 'Dismiss', status: 'dismissed' }];
        case 'acknowledged':
            return [{ label: 'Plan', status: 'planned', primary: true }, { label: 'Dismiss', status: 'dismissed' }];
        case 'planned':
            return [{ label: 'Mark applied', status: 'applied', primary: true }, { label: 'Dismiss', status: 'dismissed' }];
        case 'applied':
            return [{ label: 'Verify outcome', status: 'verified', primary: true }, { label: 'Dismiss', status: 'dismissed' }];
        default:
            return [];
    }
}

function displayEvidenceValue(value: unknown, unit?: string) {
    const rendered = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value);
    return `${rendered}${unit ? ` ${unit}` : ''}`;
}

export function CostOptimizationsList({
    optimizations,
    total = optimizations.length,
    isLoading,
    isError = false,
    isGenerating = false,
    updatingId,
    canGenerate = true,
    coverage = [],
    onGenerate,
    onUpdate,
    onRetry,
}: CostOptimizationsListProps) {
    const [notesById, setNotesById] = useState<Record<string, string>>({});

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Optimization Recommendations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col space-y-2 border p-4 rounded-lg">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex justify-between items-center mt-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <CardTitle>Optimization Recommendations</CardTitle>
                            <Badge variant="outline">{total} tracked</Badge>
                        </div>
                        <CardDescription className="mt-1">
                            Savings come from provider-native estimates; inventory-only findings stay unpriced until billing attribution is available.
                        </CardDescription>
                    </div>
                    {canGenerate && onGenerate && (
                        <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
                            <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? "animate-pulse" : ""}`} />
                            {isGenerating ? "Analyzing evidence..." : "Analyze savings"}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {coverage.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2 mb-5" aria-label="Optimization analysis coverage">
                        {coverage.map(item => (
                            <div key={`${item.provider}-${item.source}`} className="rounded-md border bg-muted/20 p-3 text-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-medium">{item.provider.toUpperCase()} · {item.source.replace(/_/g, ' ')}</span>
                                    <Badge variant={item.status === 'available' ? 'outline' : 'secondary'}>{item.status.replace(/_/g, ' ')}</Badge>
                                </div>
                                <p className="text-muted-foreground">{item.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {isError ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
                        <p className="font-medium">Recommendations could not be loaded.</p>
                        <p className="text-sm text-muted-foreground mb-4">Retry the request before running another analysis.</p>
                        {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
                    </div>
                ) : optimizations.length > 0 ? (
                    <div className="space-y-4">
                        {optimizations.map((opt) => {
                            const actions = nextActions(opt.status);
                            return (
                                <div key={opt.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={opt.provider === "aws" ? "default" : "secondary"}>{opt.provider.toUpperCase()}</Badge>
                                            <span className="font-semibold text-lg">{opt.title}</span>
                                        </div>
                                        <div className="text-right">
                                            {opt.estimatedSavings > 0 ? (
                                                <>
                                                    <div className="text-green-600 font-bold">{formatCurrency(opt.estimatedSavings)}/mo expected</div>
                                                    <div className="text-xs text-muted-foreground">range {formatCurrency(opt.savingsLow)}–{formatCurrency(opt.savingsHigh)}</div>
                                                </>
                                            ) : <div className="text-sm text-muted-foreground">Savings awaiting attribution</div>}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="outline">{opt.resourceType || "Cloud resource"}</Badge>
                                        <Badge variant="outline">{opt.optimizationType.replace(/_/g, " ")}</Badge>
                                        <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />{Math.round(opt.confidence * 100)}% confidence</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>

                                    {opt.evidence && opt.evidence.length > 0 && (
                                        <div className="rounded-md bg-muted/40 p-3 mb-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide mb-2">Evidence</p>
                                            <div className="grid gap-1 sm:grid-cols-2 text-xs">
                                                {opt.evidence.slice(0, 6).map((item, index) => (
                                                    <div key={`${item.metric}-${index}`} className="flex justify-between gap-3">
                                                        <span className="text-muted-foreground">{item.metric.replace(/_/g, ' ')}</span>
                                                        <span className="font-medium text-right">{displayEvidenceValue(item.observed, item.unit)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {opt.assumptions && opt.assumptions.length > 0 && (
                                        <div className="rounded-md border border-dashed p-3 mb-4 text-xs">
                                            <p className="font-semibold uppercase tracking-wide mb-1">Assumptions to validate</p>
                                            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                                {opt.assumptions.map((assumption, index) => <li key={index}>{assumption}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                                        {opt.currentCost > 0 && <span>Current cost: {formatCurrency(opt.currentCost)}/mo</span>}
                                        {opt.estimatedSavings > 0 && <span>Savings: {opt.savingsPercent.toFixed(1)}%</span>}
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {opt.implementation || "Review"} effort</span>
                                        <span className="flex items-center gap-1">
                                            {['applied', 'verified'].includes(opt.status) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                            {statusLabel[opt.status]}
                                        </span>
                                        <span>Source: {opt.source.replace(/_/g, ' ')}</span>
                                        {opt.realizedSavings !== undefined && <span className="text-green-700">Measured: {formatCurrency(opt.realizedSavings)}/mo</span>}
                                    </div>

                                    {onUpdate && actions.length > 0 && (
                                        <div className="space-y-3 mt-4 pt-4 border-t">
                                            <Textarea
                                                value={notesById[opt.id] ?? opt.notes ?? ''}
                                                onChange={(event) => setNotesById(current => ({ ...current, [opt.id]: event.target.value }))}
                                                placeholder="Add review notes, an owner, or a change-ticket reference"
                                                className="min-h-16"
                                                disabled={updatingId === opt.id}
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {actions.map(action => (
                                                    <Button
                                                        key={action.status}
                                                        size="sm"
                                                        variant={action.primary ? 'default' : 'outline'}
                                                        disabled={updatingId === opt.id}
                                                        onClick={() => onUpdate(opt, action.status, notesById[opt.id] ?? opt.notes)}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                        <p className="font-medium text-foreground">No recommendations yet.</p>
                        <p className="text-sm mb-4">Sync inventory and billing data, then analyze provider evidence for savings opportunities.</p>
                        {canGenerate && onGenerate && (
                            <Button variant="outline" onClick={onGenerate} disabled={isGenerating}>
                                <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? "animate-pulse" : ""}`} />
                                {isGenerating ? "Analyzing evidence..." : "Analyze savings"}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
