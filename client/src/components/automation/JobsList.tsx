import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ScheduledJob } from '@/types';
import { Play, Clock, MoreHorizontal, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobsListProps {
    jobs: ScheduledJob[];
    isLoading: boolean;
    onRun: (id: string) => void;
    onEdit: (job: ScheduledJob) => void;
    onDelete: (id: string) => void;
}

export function JobsList({ jobs, isLoading, onRun, onEdit, onDelete }: JobsListProps) {
    if (isLoading) return <div>Loading jobs...</div>;

    return (
        <Card>
            <CardContent className="p-0">
                <DataTable value={jobs ?? []} emptyMessage="No scheduled jobs found." stripedRows size="small" responsiveLayout="scroll">
                    <Column header="Job Name" body={(job: ScheduledJob) => <div className="flex flex-col"><span className="font-medium">{job.name}</span><span className="max-w-[200px] truncate text-xs text-muted-foreground">{job.description}</span></div>} />
                    <Column header="Type" body={(job: ScheduledJob) => <Badge variant="outline">{job.type}</Badge>} />
                    <Column header="Schedule" body={(job: ScheduledJob) => <span className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" />{job.schedule}</span>} />
                    <Column header="Last Run" body={(job: ScheduledJob) => job.lastRun ? new Date(job.lastRun).toLocaleString() : "Never"} />
                    <Column header="Status" body={(job: ScheduledJob) => <Badge variant="outline">{job.status === "running" ? "Running" : job.status === "failed" ? "Failed" : !job.enabled ? "Paused" : "Active"}</Badge>} />
                    <Column header="Actions" body={(job: ScheduledJob) => <div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => onRun(job.id)} title="Run Now"><Play className="h-4 w-4 text-primary" /></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(job)}>Edit Configuration</DropdownMenuItem><DropdownMenuItem>View Executions</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => onDelete(job.id)}>Delete Job</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>} />
                </DataTable>
            </CardContent>
        </Card>
    );
}
