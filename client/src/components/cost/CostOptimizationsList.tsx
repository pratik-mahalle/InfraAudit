import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostOptimization } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, Lightbulb, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CostOptimizationsListProps {
    optimizations: CostOptimization[];
    total?: number;
    isLoading: boolean;
    isError?: boolean;
    isGenerating?: boolean;
    canGenerate?: boolean;
    onGenerate?: () => void;
    onRetry?: () => void;
}

export function CostOptimizationsList({
    optimizations,
    total = optimizations.length,
    isLoading,
    isError = false,
    isGenerating = false,
    canGenerate = true,
    onGenerate,
    onRetry,
}: CostOptimizationsListProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col space-y-2 border p-4 rounded-lg">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex justify-between items-center mt-4">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-24" />
                            </div>
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
                            <Badge variant="outline">{total} pending</Badge>
                        </div>
                        <CardDescription className="mt-1">
                            Advisory estimates from imported cost history; validate each action before changing infrastructure.
                        </CardDescription>
                    </div>
                    {canGenerate && onGenerate && (
                        <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
                            <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? "animate-pulse" : ""}`} />
                            {isGenerating ? "Analyzing..." : "Generate recommendations"}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
                        <p className="font-medium">Recommendations could not be loaded.</p>
                        <p className="text-sm text-muted-foreground mb-4">Retry the request before running another analysis.</p>
                        {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
                    </div>
                ) : optimizations.length > 0 ? (
                    <div className="space-y-4">
                        {optimizations.map((opt) => (
                            <div key={opt.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={opt.provider === "aws" ? "default" : "secondary"}>
                                            {opt.provider.toUpperCase()}
                                        </Badge>
                                        <span className="font-semibold text-lg">{opt.title}</span>
                                    </div>
                                    <div className="text-green-600 font-bold">
                                        {formatCurrency(opt.estimatedSavings)}/mo savings
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline">{opt.resourceType || "Cloud resource"}</Badge>
                                    <Badge variant="outline">{opt.optimizationType.replace(/_/g, " ")}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                                    <span>Current cost: {formatCurrency(opt.currentCost)}/mo</span>
                                    <span>Savings: {opt.savingsPercent.toFixed(1)}%</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {opt.implementation || "Review"} effort
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {opt.status === "pending" ? (
                                            <AlertCircle className="w-3 h-3 text-amber-500" />
                                        ) : (
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                        )}
                                        {opt.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                        <p className="font-medium text-foreground">No pending recommendations yet.</p>
                        <p className="text-sm mb-4">Import cost history, then generate an analysis to find savings opportunities.</p>
                        {canGenerate && onGenerate && (
                            <Button variant="outline" onClick={onGenerate} disabled={isGenerating}>
                                <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? "animate-pulse" : ""}`} />
                                {isGenerating ? "Analyzing..." : "Generate recommendations"}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
