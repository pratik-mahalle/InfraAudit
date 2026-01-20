import React from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostOptimization } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CostOptimizationsListProps {
    optimizations: CostOptimization[];
    isLoading: boolean;
    onApply: (id: string) => void;
    onDismiss: (id: string) => void;
}

export function CostOptimizationsList({
    optimizations,
    isLoading,
    onApply,
    onDismiss
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
                <div className="flex justify-between items-center">
                    <CardTitle>Optimization Recommendations</CardTitle>
                    <Badge variant="outline">{optimizations?.length || 0} found</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {optimizations && optimizations.length > 0 ? (
                    <div className="space-y-4">
                        {optimizations.map((opt) => (
                            <div
                                key={opt.id}
                                className="border p-4 rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={opt.provider === 'aws' ? 'default' : 'secondary'}>
                                            {opt.provider.toUpperCase()}
                                        </Badge>
                                        <span className="font-semibold text-lg">{opt.resourceType}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                        <span>{formatCurrency(opt.estimatedSavings)}/mo</span>
                                    </div>
                                </div>

                                <h4 className="font-medium mb-1 font-inter">{opt.optimizationType.replace(/_/g, ' ')}</h4>
                                <p className="text-sm text-gray-500 mb-4">{opt.description}</p>

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(opt.detectedAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {opt.status === 'open' ? (
                                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                            ) : (
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                            )}
                                            {opt.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        Confidence: {(opt.confidence * 100).toFixed(0)}%
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDismiss(opt.id)}
                                        disabled={opt.status !== 'open'}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onApply(opt.id)}
                                        disabled={opt.status !== 'open'}
                                    >
                                        Apply Fix
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                        <p>No active optimization recommendations.</p>
                        <p className="text-sm">Great job! Your infrastructure is optimized.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
