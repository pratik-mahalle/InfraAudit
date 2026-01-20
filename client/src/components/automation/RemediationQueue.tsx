import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { RemediationAction } from '@/types';

interface RemediationQueueProps {
    items: RemediationAction[];
    isLoading: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export function RemediationQueue({ items, isLoading, onApprove, onReject }: RemediationQueueProps) {
    if (isLoading) return <div>Loading queue...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    Pending Approvals
                    {items && items.length > 0 && <Badge variant="destructive">{items.length}</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items && items.length > 0 ? (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="border p-4 rounded-lg bg-yellow-50/50 border-yellow-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white">{item.type}</Badge>
                                        <span className="font-semibold">{item.resourceId}</span>
                                    </div>
                                    <Badge variant="secondary">{item.severity}</Badge>
                                </div>

                                <p className="text-sm text-gray-700 mb-3">{item.description}</p>

                                {item.driftId && (
                                    <div className="text-xs text-muted-foreground mb-3">
                                        Linked to drift detection #{item.driftId}
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => onReject(item.id)}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => onApprove(item.id)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve & Execute
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                        <p>No pending approvals. All clean!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
