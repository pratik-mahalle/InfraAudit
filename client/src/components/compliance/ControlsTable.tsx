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
import { ComplianceControl } from '@/types';
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ControlsTableProps {
    controls: ComplianceControl[];
    isLoading: boolean;
    onView: (control: ComplianceControl) => void;
    selectedId?: string | null;
}

export function ControlsTable({ controls, isLoading, onView, selectedId }: ControlsTableProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Control</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {controls.length > 0 ? (
                        controls.map((control) => (
                            <TableRow key={control.id} className={cn(selectedId === control.id && "bg-muted/70")}>
                                <TableCell className="font-mono font-medium">{control.controlId}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{control.title}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                                            {control.description}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{control.category}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        control.severity === 'critical' ? 'destructive' :
                                            control.severity === 'high' ? 'default' :
                                                'secondary'
                                    }>
                                        {control.severity}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant={selectedId === control.id ? "secondary" : "outline"} size="sm" className="gap-2" onClick={() => onView(control)}>
                                        <Eye className="h-4 w-4" />
                                        Review
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No controls found for this framework.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
